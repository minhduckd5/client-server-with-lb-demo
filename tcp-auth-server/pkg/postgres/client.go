package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Client wraps the PostgreSQL connection pool
type Client struct {
	pool *pgxpool.Pool
	ctx  context.Context
}

// NewClient creates a new PostgreSQL client
func NewClient(host, port, user, password, database string) (*Client, error) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, database)

	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to parse connection string: %w", err)
	}

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	ctx := context.Background()

	// Test connection
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to connect to PostgreSQL: %w", err)
	}

	return &Client{
		pool: pool,
		ctx:  ctx,
	}, nil
}

// Pool returns the underlying connection pool
func (c *Client) Pool() *pgxpool.Pool {
	return c.pool
}

// Context returns the default context
func (c *Client) Context() context.Context {
	return c.ctx
}

// Close closes the connection pool
func (c *Client) Close() {
	c.pool.Close()
}


