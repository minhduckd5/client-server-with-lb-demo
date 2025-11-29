package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"

	"tcp-auth-server/internal/models"
	"tcp-auth-server/internal/repository"
	"tcp-auth-server/pkg/redis"
)

// SessionService handles session management
type SessionService struct {
	redisClient      *redis.Client
	sessionRepo      *repository.SessionRepository
	userRepo         *repository.UserRepository
	sessionTTL       time.Duration
}

// NewSessionService creates a new session service
func NewSessionService(
	redisClient *redis.Client,
	sessionRepo *repository.SessionRepository,
	userRepo *repository.UserRepository,
	sessionTTL time.Duration,
) *SessionService {
	return &SessionService{
		redisClient: redisClient,
		sessionRepo: sessionRepo,
		userRepo:    userRepo,
		sessionTTL:  sessionTTL,
	}
}

// GenerateToken generates a cryptographically secure session token
func (s *SessionService) GenerateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("failed to generate token: %w", err)
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// CreateSession creates a new session for a user
func (s *SessionService) CreateSession(ctx context.Context, user *models.User) (*models.Session, error) {
	token, err := s.GenerateToken()
	if err != nil {
		return nil, err
	}

	expiresAt := time.Now().Add(s.sessionTTL)
	session := &models.Session{
		Token:     token,
		UserID:    user.ID,
		Username:  user.Username,
		Email:     user.Email,
		ExpiresAt: expiresAt,
		CreatedAt: time.Now(),
	}

	// Store in Redis
	sessionKey := fmt.Sprintf("session:%s", token)
	if err := s.redisClient.Set(sessionKey, session, s.sessionTTL); err != nil {
		return nil, fmt.Errorf("failed to store session in Redis: %w", err)
	}

	// Add to user's session set
	userSessionsKey := fmt.Sprintf("user_sessions:%s", user.ID)
	if err := s.redisClient.SAdd(userSessionsKey, token); err != nil {
		return nil, fmt.Errorf("failed to add session to user set: %w", err)
	}
	if err := s.redisClient.SetExpiration(userSessionsKey, s.sessionTTL); err != nil {
		// Non-critical error, log but continue
		fmt.Printf("Warning: failed to set expiration on user_sessions key: %v\n", err)
	}

	// Store in PostgreSQL as backup/audit
	if err := s.sessionRepo.CreateSession(ctx, user.ID, token, expiresAt); err != nil {
		// Non-critical error, log but continue
		fmt.Printf("Warning: failed to store session in PostgreSQL: %v\n", err)
	}

	return session, nil
}

// GetSession retrieves a session by token
func (s *SessionService) GetSession(token string) (*models.Session, error) {
	sessionKey := fmt.Sprintf("session:%s", token)

	var session models.Session
	if err := s.redisClient.Get(sessionKey, &session); err != nil {
		return nil, fmt.Errorf("session not found or expired")
	}

	// Check if session is expired
	if time.Now().After(session.ExpiresAt) {
		s.DeleteSession(context.Background(), token)
		return nil, fmt.Errorf("session expired")
	}

	return &session, nil
}

// ValidateSession validates a session token
func (s *SessionService) ValidateSession(token string) (*models.Session, error) {
	return s.GetSession(token)
}

// DeleteSession removes a session
func (s *SessionService) DeleteSession(ctx context.Context, token string) error {
	session, err := s.GetSession(token)
	if err != nil {
		// Session might already be deleted, try to clean up anyway
		sessionKey := fmt.Sprintf("session:%s", token)
		_ = s.redisClient.Delete(sessionKey)
		_ = s.sessionRepo.DeleteSession(ctx, token)
		return nil
	}

	// Remove from Redis
	sessionKey := fmt.Sprintf("session:%s", token)
	if err := s.redisClient.Delete(sessionKey); err != nil {
		fmt.Printf("Warning: failed to delete session from Redis: %v\n", err)
	}

	// Remove from user's session set
	userSessionsKey := fmt.Sprintf("user_sessions:%s", session.UserID)
	if err := s.redisClient.SRem(userSessionsKey, token); err != nil {
		fmt.Printf("Warning: failed to remove session from user set: %v\n", err)
	}

	// Remove from PostgreSQL
	if err := s.sessionRepo.DeleteSession(ctx, token); err != nil {
		fmt.Printf("Warning: failed to delete session from PostgreSQL: %v\n", err)
	}

	return nil
}

// RefreshSession extends a session's expiration
func (s *SessionService) RefreshSession(ctx context.Context, token string) (*models.Session, error) {
	session, err := s.GetSession(token)
	if err != nil {
		return nil, err
	}

	// Get user to recreate session
	user, err := s.userRepo.GetUserByID(ctx, session.UserID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Delete old session
	if err := s.DeleteSession(ctx, token); err != nil {
		fmt.Printf("Warning: failed to delete old session: %v\n", err)
	}

	// Create new session
	return s.CreateSession(ctx, user)
}

// DeleteUserSessions removes all sessions for a user
func (s *SessionService) DeleteUserSessions(ctx context.Context, userID string) error {
	userSessionsKey := fmt.Sprintf("user_sessions:%s", userID)
	tokens, err := s.redisClient.SMembers(userSessionsKey)
	if err != nil {
		// Key might not exist, continue
	}

	// Delete all sessions
	for _, token := range tokens {
		sessionKey := fmt.Sprintf("session:%s", token)
		_ = s.redisClient.Delete(sessionKey)
		_ = s.sessionRepo.DeleteSession(ctx, token)
	}

	// Delete user sessions set
	_ = s.redisClient.Delete(userSessionsKey)

	// Delete from PostgreSQL
	if err := s.sessionRepo.DeleteUserSessions(ctx, userID); err != nil {
		fmt.Printf("Warning: failed to delete user sessions from PostgreSQL: %v\n", err)
	}

	return nil
}


