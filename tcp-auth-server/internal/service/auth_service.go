package service

import (
	"context"
	"fmt"

	"tcp-auth-server/internal/models"
	"tcp-auth-server/internal/repository"

	"golang.org/x/crypto/bcrypt"
)

// AuthService handles authentication logic
type AuthService struct {
	userRepo       *repository.UserRepository
	sessionService *SessionService
}

// GetSessionService returns the session service (for handlers that need direct access)
func (s *AuthService) GetSessionService() *SessionService {
	return s.sessionService
}

// NewAuthService creates a new authentication service
func NewAuthService(
	userRepo *repository.UserRepository,
	sessionService *SessionService,
) *AuthService {
	return &AuthService{
		userRepo:       userRepo,
		sessionService: sessionService,
	}
}

// HashPassword hashes a password using bcrypt
func (s *AuthService) HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}
	return string(hash), nil
}

// VerifyPassword verifies a password against a hash
func (s *AuthService) VerifyPassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

// Register creates a new user account
func (s *AuthService) Register(ctx context.Context, username, email, password string) (*models.User, error) {
	// Validate input
	if username == "" {
		return nil, fmt.Errorf("username is required")
	}
	if email == "" {
		return nil, fmt.Errorf("email is required")
	}
	if password == "" {
		return nil, fmt.Errorf("password is required")
	}
	if len(password) < 6 {
		return nil, fmt.Errorf("password must be at least 6 characters")
	}

	// Check if user already exists
	exists, err := s.userRepo.UserExists(ctx, username, email)
	if err != nil {
		return nil, fmt.Errorf("failed to check user existence: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("username or email already exists")
	}

	// Hash password
	passwordHash, err := s.HashPassword(password)
	if err != nil {
		return nil, err
	}

	// Create user
	user, err := s.userRepo.CreateUser(ctx, username, email, passwordHash)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// Login authenticates a user and creates a session
func (s *AuthService) Login(ctx context.Context, username, password string) (*models.Session, error) {
	// Validate input
	if username == "" {
		return nil, fmt.Errorf("username is required")
	}
	if password == "" {
		return nil, fmt.Errorf("password is required")
	}

	// Get user by username
	user, err := s.userRepo.GetUserByUsername(ctx, username)
	if err != nil {
		return nil, fmt.Errorf("invalid username or password")
	}

	// Verify password
	if err := s.VerifyPassword(user.PasswordHash, password); err != nil {
		return nil, fmt.Errorf("invalid username or password")
	}

	// Create session
	session, err := s.sessionService.CreateSession(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	return session, nil
}

// Logout invalidates a session
func (s *AuthService) Logout(ctx context.Context, token string) error {
	if token == "" {
		return fmt.Errorf("token is required")
	}

	return s.sessionService.DeleteSession(ctx, token)
}

// ValidateToken validates a session token and returns user info
func (s *AuthService) ValidateToken(ctx context.Context, token string) (*models.User, error) {
	if token == "" {
		return nil, fmt.Errorf("token is required")
	}

	session, err := s.sessionService.ValidateSession(token)
	if err != nil {
		return nil, fmt.Errorf("invalid or expired token")
	}

	user, err := s.userRepo.GetUserByID(ctx, session.UserID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return user, nil
}

