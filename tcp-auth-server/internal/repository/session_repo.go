package repository

import (
	"context"
	"fmt"
	"time"

	"tcp-auth-server/pkg/postgres"

	"github.com/jackc/pgx/v5"
)

// SessionRepository handles session data operations in PostgreSQL (backup/audit)
type SessionRepository struct {
	pool *postgres.Client
}

// NewSessionRepository creates a new session repository
func NewSessionRepository(pool *postgres.Client) *SessionRepository {
	return &SessionRepository{
		pool: pool,
	}
}

// CreateSession creates a session record in PostgreSQL
func (r *SessionRepository) CreateSession(ctx context.Context, userID, sessionToken string, expiresAt time.Time) error {
	query := `
		INSERT INTO user_sessions (user_id, session_token, expires_at, created_at)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (session_token) DO UPDATE
		SET expires_at = EXCLUDED.expires_at, created_at = EXCLUDED.created_at
	`

	_, err := r.pool.Pool().Exec(ctx, query, userID, sessionToken, expiresAt, time.Now())
	if err != nil {
		return fmt.Errorf("failed to create session: %w", err)
	}

	return nil
}

// GetSession retrieves a session by token
func (r *SessionRepository) GetSession(ctx context.Context, sessionToken string) (string, time.Time, error) {
	query := `
		SELECT user_id, expires_at
		FROM user_sessions
		WHERE session_token = $1
	`

	var userID string
	var expiresAt time.Time
	err := r.pool.Pool().QueryRow(ctx, query, sessionToken).Scan(&userID, &expiresAt)

	if err == pgx.ErrNoRows {
		return "", time.Time{}, fmt.Errorf("session not found")
	}
	if err != nil {
		return "", time.Time{}, fmt.Errorf("failed to get session: %w", err)
	}

	return userID, expiresAt, nil
}

// DeleteSession removes a session by token
func (r *SessionRepository) DeleteSession(ctx context.Context, sessionToken string) error {
	query := `DELETE FROM user_sessions WHERE session_token = $1`

	_, err := r.pool.Pool().Exec(ctx, query, sessionToken)
	if err != nil {
		return fmt.Errorf("failed to delete session: %w", err)
	}

	return nil
}

// DeleteUserSessions removes all sessions for a user
func (r *SessionRepository) DeleteUserSessions(ctx context.Context, userID string) error {
	query := `DELETE FROM user_sessions WHERE user_id = $1`

	_, err := r.pool.Pool().Exec(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("failed to delete user sessions: %w", err)
	}

	return nil
}

// CleanExpiredSessions removes expired sessions
func (r *SessionRepository) CleanExpiredSessions(ctx context.Context) error {
	query := `DELETE FROM user_sessions WHERE expires_at < NOW()`

	_, err := r.pool.Pool().Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to clean expired sessions: %w", err)
	}

	return nil
}


