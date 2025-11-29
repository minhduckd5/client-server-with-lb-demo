package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// Client wraps the Redis client
type Client struct {
	rdb *redis.Client
	ctx context.Context
}

// NewClient creates a new Redis client
func NewClient(host, port, password string) (*Client, error) {
	addr := fmt.Sprintf("%s:%s", host, port)
	opts := &redis.Options{
		Addr:     addr,
		Password: password,
		DB:       0,
	}

	rdb := redis.NewClient(opts)
	ctx := context.Background()

	// Test connection
	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &Client{
		rdb: rdb,
		ctx: ctx,
	}, nil
}

// Set stores a key-value pair with expiration
func (c *Client) Set(key string, value interface{}, expiration time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return c.rdb.Set(c.ctx, key, data, expiration).Err()
}

// Get retrieves a value by key
func (c *Client) Get(key string, dest interface{}) error {
	val, err := c.rdb.Get(c.ctx, key).Result()
	if err == redis.Nil {
		return fmt.Errorf("key not found")
	}
	if err != nil {
		return err
	}
	return json.Unmarshal([]byte(val), dest)
}

// Delete removes a key
func (c *Client) Delete(key string) error {
	return c.rdb.Del(c.ctx, key).Err()
}

// Exists checks if a key exists
func (c *Client) Exists(key string) (bool, error) {
	count, err := c.rdb.Exists(c.ctx, key).Result()
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// SAdd adds a member to a set
func (c *Client) SAdd(key string, members ...interface{}) error {
	return c.rdb.SAdd(c.ctx, key, members...).Err()
}

// SMembers returns all members of a set
func (c *Client) SMembers(key string) ([]string, error) {
	return c.rdb.SMembers(c.ctx, key).Result()
}

// SRem removes members from a set
func (c *Client) SRem(key string, members ...interface{}) error {
	return c.rdb.SRem(c.ctx, key, members...).Err()
}

// SetExpiration sets expiration on a key
func (c *Client) SetExpiration(key string, expiration time.Duration) error {
	return c.rdb.Expire(c.ctx, key, expiration).Err()
}

// Close closes the Redis connection
func (c *Client) Close() error {
	return c.rdb.Close()
}


