package handler

import (
	"context"
	"encoding/json"
	"fmt"

	"tcp-auth-server/internal/models"
	"tcp-auth-server/internal/service"
	"tcp-auth-server/pkg/protocol"
)

// AuthHandler handles authentication requests
type AuthHandler struct {
	authService *service.AuthService
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// HandleRequest processes a request and returns a response
func (h *AuthHandler) HandleRequest(ctx context.Context, req *protocol.Request) (*protocol.Response, error) {
	switch req.Type {
	case "register":
		return h.handleRegister(ctx, req)
	case "login":
		return h.handleLogin(ctx, req)
	case "logout":
		return h.handleLogout(ctx, req)
	case "validate":
		return h.handleValidate(ctx, req)
	case "refresh":
		return h.handleRefresh(ctx, req)
	default:
		return protocol.ErrorResponse(fmt.Sprintf("unknown request type: %s", req.Type)), nil
	}
}

// handleRegister handles user registration
func (h *AuthHandler) handleRegister(ctx context.Context, req *protocol.Request) (*protocol.Response, error) {
	if req.Username == "" || req.Email == "" || req.Password == "" {
		return protocol.ErrorResponse("username, email, and password are required"), nil
	}

	user, err := h.authService.Register(ctx, req.Username, req.Email, req.Password)
	if err != nil {
		return protocol.ErrorResponse(err.Error()), nil
	}

	data := protocol.RegisterResponseData{
		UserID:   user.ID,
		Username: user.Username,
		Email:    user.Email,
	}

	return protocol.SuccessResponse(data)
}

// handleLogin handles user login
func (h *AuthHandler) handleLogin(ctx context.Context, req *protocol.Request) (*protocol.Response, error) {
	if req.Username == "" || req.Password == "" {
		return protocol.ErrorResponse("username and password are required"), nil
	}

	session, err := h.authService.Login(ctx, req.Username, req.Password)
	if err != nil {
		return protocol.ErrorResponse(err.Error()), nil
	}

	data := protocol.LoginResponseData{
		Token:     session.Token,
		UserID:    session.UserID,
		Username:  session.Username,
		Email:     session.Email,
		ExpiresAt: session.ExpiresAt.Unix(),
	}

	return protocol.SuccessResponse(data)
}

// handleLogout handles user logout
func (h *AuthHandler) handleLogout(ctx context.Context, req *protocol.Request) (*protocol.Response, error) {
	if req.Token == "" {
		return protocol.ErrorResponse("token is required"), nil
	}

	err := h.authService.Logout(ctx, req.Token)
	if err != nil {
		return protocol.ErrorResponse(err.Error()), nil
	}

	return protocol.SuccessResponse(map[string]string{"message": "logged out successfully"})
}

// handleValidate handles token validation
func (h *AuthHandler) handleValidate(ctx context.Context, req *protocol.Request) (*protocol.Response, error) {
	if req.Token == "" {
		return protocol.ErrorResponse("token is required"), nil
	}

	user, err := h.authService.ValidateToken(ctx, req.Token)
	if err != nil {
		data := protocol.ValidateResponseData{
			Valid: false,
		}
		return protocol.SuccessResponse(data)
	}

	data := protocol.ValidateResponseData{
		Valid:    true,
		UserID:   user.ID,
		Username: user.Username,
		Email:    user.Email,
	}

	return protocol.SuccessResponse(data)
}

// handleRefresh handles session refresh
func (h *AuthHandler) handleRefresh(ctx context.Context, req *protocol.Request) (*protocol.Response, error) {
	if req.Token == "" {
		return protocol.ErrorResponse("token is required"), nil
	}

	// Validate token and get user
	user, err := h.authService.ValidateToken(ctx, req.Token)
	if err != nil {
		return protocol.ErrorResponse("invalid or expired token"), nil
	}

	// Get session service to refresh
	sessionService := h.authService.GetSessionService()
	session, err := sessionService.RefreshSession(ctx, req.Token)
	if err != nil {
		return protocol.ErrorResponse(err.Error()), nil
	}

	data := protocol.LoginResponseData{
		Token:     session.Token,
		UserID:    session.UserID,
		Username:  session.Username,
		Email:     session.Email,
		ExpiresAt: session.ExpiresAt.Unix(),
	}

	return protocol.SuccessResponse(data)
}

// ConnectionInfo tracks connection state
type ConnectionInfo struct {
	ConnID  string
	UserID  string
	Token   string
	Session *models.Session
}

// SetConnectionSession associates a session with a connection
func (h *AuthHandler) SetConnectionSession(connID string, session *models.Session) {
	// This can be used to track active connections
	// Implementation depends on how we want to store connection info
}

