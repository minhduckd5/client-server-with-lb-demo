package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"strconv"
	"sync"
	"syscall"
	"time"

	"tcp-auth-server/internal/handler"
	"tcp-auth-server/internal/repository"
	"tcp-auth-server/internal/service"
	"tcp-auth-server/pkg/postgres"
	"tcp-auth-server/pkg/protocol"
	"tcp-auth-server/pkg/redis"

	"github.com/google/uuid"
)

// Server represents the TCP authentication server
type Server struct {
	host           string
	port           string
	redisClient    *redis.Client
	postgresClient *postgres.Client
	authHandler    *handler.AuthHandler
	connections    map[string]*Connection
	mu             sync.RWMutex
	ctx            context.Context
	cancel         context.CancelFunc
}

// Connection represents a client connection
type Connection struct {
	ID       string
	Conn     net.Conn
	UserID   string
	Token    string
	LastSeen time.Time
}

// NewServer creates a new TCP server
func NewServer(host, port string) (*Server, error) {
	// Load environment variables
	redisHost := getEnv("REDIS_HOST", "localhost")
	redisPort := getEnv("REDIS_PORT", "6379")
	redisPassword := getEnv("REDIS_PASSWORD", "")

	pgHost := getEnv("PG_HOST", "localhost")
	pgPort := getEnv("PG_PORT", "5432")
	pgUser := getEnv("PG_USER", "postgres")
	pgPassword := getEnv("PG_PASSWORD", "")
	pgDatabase := getEnv("PG_DATABASE", "ShoppingCS-LB")

	sessionTTLSeconds := getEnv("SESSION_TTL", "86400")
	sessionTTL, err := strconv.Atoi(sessionTTLSeconds)
	if err != nil {
		sessionTTL = 86400 // Default 24 hours
	}

	// Initialize Redis client
	redisClient, err := redis.NewClient(redisHost, redisPort, redisPassword)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Redis: %w", err)
	}

	// Initialize PostgreSQL client
	postgresClient, err := postgres.NewClient(pgHost, pgPort, pgUser, pgPassword, pgDatabase)
	if err != nil {
		redisClient.Close()
		return nil, fmt.Errorf("failed to initialize PostgreSQL: %w", err)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(postgresClient)
	sessionRepo := repository.NewSessionRepository(postgresClient)

	// Initialize services
	sessionService := service.NewSessionService(
		redisClient,
		sessionRepo,
		userRepo,
		time.Duration(sessionTTL)*time.Second,
	)
	authService := service.NewAuthService(userRepo, sessionService)

	// Initialize handler
	authHandler := handler.NewAuthHandler(authService)

	ctx, cancel := context.WithCancel(context.Background())

	server := &Server{
		host:           host,
		port:           port,
		redisClient:    redisClient,
		postgresClient: postgresClient,
		authHandler:    authHandler,
		connections:    make(map[string]*Connection),
		ctx:            ctx,
		cancel:         cancel,
	}

	// Start connection cleanup goroutine
	go server.cleanupConnections()

	return server, nil
}

// Start starts the TCP server
func (s *Server) Start() error {
	addr := fmt.Sprintf("%s:%s", s.host, s.port)
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		return fmt.Errorf("failed to listen on %s: %w", addr, err)
	}
	defer listener.Close()

	log.Printf("TCP Authentication Server listening on %s", addr)

	// Handle graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("Shutting down server...")
		s.cancel()
		listener.Close()
	}()

	// Accept connections
	for {
		conn, err := listener.Accept()
		if err != nil {
			select {
			case <-s.ctx.Done():
				return nil
			default:
				log.Printf("Error accepting connection: %v", err)
				continue
			}
		}

		// Handle connection in goroutine
		go s.handleConnection(conn)
	}
}

// handleConnection handles a client connection
func (s *Server) handleConnection(conn net.Conn) {
	connID := uuid.New().String()
	connection := &Connection{
		ID:       connID,
		Conn:     conn,
		LastSeen: time.Now(),
	}

	s.mu.Lock()
	s.connections[connID] = connection
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		delete(s.connections, connID)
		s.mu.Unlock()
		
		// Remove connection info from Redis
		connKey := fmt.Sprintf("connection:%s", connID)
		_ = s.redisClient.Delete(connKey)
		
		conn.Close()
		log.Printf("Connection %s closed", connID)
	}()

	log.Printf("New connection from %s (ID: %s)", conn.RemoteAddr(), connID)

	scanner := bufio.NewScanner(conn)
	for scanner.Scan() {
		connection.LastSeen = time.Now()

		line := scanner.Text()
		if line == "" {
			continue
		}

		// Parse request
		var req protocol.Request
		if err := json.Unmarshal([]byte(line), &req); err != nil {
			resp := protocol.ErrorResponse("invalid JSON format")
			s.sendResponse(conn, resp)
			continue
		}

		// Handle request
		resp, err := s.authHandler.HandleRequest(s.ctx, &req)
		if err != nil {
			log.Printf("Error handling request: %v", err)
			resp = protocol.ErrorResponse("internal server error")
		}

		// Update connection info if login was successful
		if req.Type == "login" && resp.Status == "success" {
			var loginData protocol.LoginResponseData
			if err := json.Unmarshal(resp.Data, &loginData); err == nil {
				connection.UserID = loginData.UserID
				connection.Token = loginData.Token
				
				// Store connection info in Redis
				connKey := fmt.Sprintf("connection:%s", connID)
				connInfo := map[string]string{
					"user_id": loginData.UserID,
					"token":   loginData.Token,
				}
				_ = s.redisClient.Set(connKey, connInfo, 30*time.Minute)
			}
		}

		// Send response
		if err := s.sendResponse(conn, resp); err != nil {
			log.Printf("Error sending response: %v", err)
			return
		}
	}

	if err := scanner.Err(); err != nil {
		log.Printf("Scanner error: %v", err)
	}
}

// sendResponse sends a response to the client
func (s *Server) sendResponse(conn net.Conn, resp *protocol.Response) error {
	data, err := json.Marshal(resp)
	if err != nil {
		return err
	}

	data = append(data, '\n')
	_, err = conn.Write(data)
	return err
}

// cleanupConnections periodically cleans up stale connections
func (s *Server) cleanupConnections() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-s.ctx.Done():
			return
		case <-ticker.C:
			s.mu.Lock()
			now := time.Now()
			for id, conn := range s.connections {
				if now.Sub(conn.LastSeen) > 30*time.Minute {
					log.Printf("Closing stale connection %s", id)
					conn.Conn.Close()
					delete(s.connections, id)
				}
			}
			s.mu.Unlock()
		}
	}
}

// Close closes the server and cleans up resources
func (s *Server) Close() error {
	s.cancel()

	s.mu.Lock()
	for _, conn := range s.connections {
		conn.Conn.Close()
	}
	s.connections = nil
	s.mu.Unlock()

	if s.redisClient != nil {
		if err := s.redisClient.Close(); err != nil {
			log.Printf("Error closing Redis client: %v", err)
		}
	}

	if s.postgresClient != nil {
		s.postgresClient.Close()
	}

	return nil
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func main() {
	host := getEnv("TCP_AUTH_HOST", "0.0.0.0")
	port := getEnv("TCP_AUTH_PORT", "9090")

	server, err := NewServer(host, port)
	if err != nil {
		log.Fatalf("Failed to create server: %v", err)
	}

	if err := server.Start(); err != nil {
		log.Fatalf("Server error: %v", err)
	}

	if err := server.Close(); err != nil {
		log.Printf("Error closing server: %v", err)
	}
}

