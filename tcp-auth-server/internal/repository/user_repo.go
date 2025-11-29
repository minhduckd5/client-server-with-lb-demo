package repository

import (
	"context"
	"fmt"
	"time"

	"tcp-auth-server/internal/models"
	"tcp-auth-server/pkg/postgres"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// UserRepository handles user data operations
type UserRepository struct {
	pool *postgres.Client
}

// NewUserRepository creates a new user repository
func NewUserRepository(pool *postgres.Client) *UserRepository {
	return &UserRepository{
		pool: pool,
	}
}

// CreateUser creates a new user
func (r *UserRepository) CreateUser(ctx context.Context, username, email, passwordHash string) (*models.User, error) {
	userID := uuid.New().String()
	now := time.Now()

	query := `
		INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, username, email, created_at, updated_at
	`

	var user models.User
	err := r.pool.Pool().QueryRow(ctx, query,
		userID, username, email, passwordHash, now, now,
	).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return &user, nil
}

// GetUserByUsername retrieves a user by username
func (r *UserRepository) GetUserByUsername(ctx context.Context, username string) (*models.User, error) {
	query := `
		SELECT id, username, email, password_hash, created_at, updated_at
		FROM users
		WHERE username = $1
	`

	var user models.User
	err := r.pool.Pool().QueryRow(ctx, query, username).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

// GetUserByEmail retrieves a user by email
func (r *UserRepository) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT id, username, email, password_hash, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	var user models.User
	err := r.pool.Pool().QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

// GetUserByID retrieves a user by ID
func (r *UserRepository) GetUserByID(ctx context.Context, userID string) (*models.User, error) {
	query := `
		SELECT id, username, email, password_hash, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	var user models.User
	err := r.pool.Pool().QueryRow(ctx, query, userID).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

// UserExists checks if a username or email already exists
func (r *UserRepository) UserExists(ctx context.Context, username, email string) (bool, error) {
	query := `
		SELECT COUNT(*) > 0
		FROM users
		WHERE username = $1 OR email = $2
	`

	var exists bool
	err := r.pool.Pool().QueryRow(ctx, query, username, email).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check user existence: %w", err)
	}

	return exists, nil
}


