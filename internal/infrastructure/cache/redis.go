package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

// Client wraps Redis client with additional functionality
type Client struct {
	rdb    *redis.Client
	logger *zap.Logger
	prefix string
}

// Config holds Redis configuration
type Config struct {
	URL      string
	Password string
	DB       int
	PoolSize int
	Prefix   string
}

// NewClient creates a new Redis client
func NewClient(cfg Config, logger *zap.Logger) (*Client, error) {
	opts, err := redis.ParseURL(cfg.URL)
	if err != nil {
		// Fallback to direct configuration
		opts = &redis.Options{
			Addr:     cfg.URL,
			Password: cfg.Password,
			DB:       cfg.DB,
			PoolSize: cfg.PoolSize,
		}
	}

	if cfg.Password != "" {
		opts.Password = cfg.Password
	}
	if cfg.DB > 0 {
		opts.DB = cfg.DB
	}
	if cfg.PoolSize > 0 {
		opts.PoolSize = cfg.PoolSize
	}

	rdb := redis.NewClient(opts)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	prefix := cfg.Prefix
	if prefix == "" {
		prefix = "turbozap"
	}

	logger.Info("🔴 Connected to Redis",
		zap.String("addr", opts.Addr),
		zap.Int("db", opts.DB),
	)

	return &Client{
		rdb:    rdb,
		logger: logger,
		prefix: prefix,
	}, nil
}

// Close closes the Redis connection
func (c *Client) Close() error {
	return c.rdb.Close()
}

// key prefixes the key with the configured prefix
func (c *Client) key(k string) string {
	return c.prefix + ":" + k
}

// Get retrieves a value from Redis
func (c *Client) Get(ctx context.Context, key string) (string, error) {
	return c.rdb.Get(ctx, c.key(key)).Result()
}

// Set stores a value in Redis with TTL
func (c *Client) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	return c.rdb.Set(ctx, c.key(key), value, ttl).Err()
}

// SetJSON stores a JSON value in Redis
func (c *Client) SetJSON(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}
	return c.Set(ctx, key, data, ttl)
}

// GetJSON retrieves and unmarshals a JSON value from Redis
func (c *Client) GetJSON(ctx context.Context, key string, dest interface{}) error {
	data, err := c.Get(ctx, key)
	if err != nil {
		return err
	}
	return json.Unmarshal([]byte(data), dest)
}

// Delete removes a key from Redis
func (c *Client) Delete(ctx context.Context, keys ...string) error {
	prefixedKeys := make([]string, len(keys))
	for i, k := range keys {
		prefixedKeys[i] = c.key(k)
	}
	return c.rdb.Del(ctx, prefixedKeys...).Err()
}

// Exists checks if a key exists
func (c *Client) Exists(ctx context.Context, key string) (bool, error) {
	result, err := c.rdb.Exists(ctx, c.key(key)).Result()
	return result > 0, err
}

// Expire sets TTL on a key
func (c *Client) Expire(ctx context.Context, key string, ttl time.Duration) error {
	return c.rdb.Expire(ctx, c.key(key), ttl).Err()
}

// Incr increments a counter
func (c *Client) Incr(ctx context.Context, key string) (int64, error) {
	return c.rdb.Incr(ctx, c.key(key)).Result()
}

// IncrBy increments a counter by a value
func (c *Client) IncrBy(ctx context.Context, key string, value int64) (int64, error) {
	return c.rdb.IncrBy(ctx, c.key(key), value).Result()
}

// TTL returns the remaining TTL of a key
func (c *Client) TTL(ctx context.Context, key string) (time.Duration, error) {
	return c.rdb.TTL(ctx, c.key(key)).Result()
}

// RateLimiter implements rate limiting using Redis
type RateLimiter struct {
	client     *Client
	logger     *zap.Logger
	windowSize time.Duration
	maxRequests int64
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(client *Client, windowSize time.Duration, maxRequests int64, logger *zap.Logger) *RateLimiter {
	return &RateLimiter{
		client:      client,
		logger:      logger,
		windowSize:  windowSize,
		maxRequests: maxRequests,
	}
}

// RateLimitResult holds the result of a rate limit check
type RateLimitResult struct {
	Allowed   bool
	Remaining int64
	ResetAt   time.Time
}

// Allow checks if a request is allowed under the rate limit
func (r *RateLimiter) Allow(ctx context.Context, identifier string) (*RateLimitResult, error) {
	key := fmt.Sprintf("ratelimit:%s", identifier)
	now := time.Now()
	windowStart := now.Truncate(r.windowSize)
	windowKey := fmt.Sprintf("%s:%d", key, windowStart.Unix())

	// Increment counter
	count, err := r.client.Incr(ctx, windowKey)
	if err != nil {
		return nil, fmt.Errorf("failed to increment rate limit counter: %w", err)
	}

	// Set expiration on first request
	if count == 1 {
		if err := r.client.Expire(ctx, windowKey, r.windowSize+time.Second); err != nil {
			r.logger.Warn("Failed to set rate limit expiration", zap.Error(err))
		}
	}

	result := &RateLimitResult{
		Allowed:   count <= r.maxRequests,
		Remaining: r.maxRequests - count,
		ResetAt:   windowStart.Add(r.windowSize),
	}

	if result.Remaining < 0 {
		result.Remaining = 0
	}

	if !result.Allowed {
		r.logger.Warn("⚠️ Rate limit exceeded",
			zap.String("identifier", identifier),
			zap.Int64("count", count),
			zap.Int64("max", r.maxRequests),
		)
	}

	return result, nil
}

// Deduplicator handles message deduplication
type Deduplicator struct {
	client *Client
	logger *zap.Logger
	ttl    time.Duration
}

// NewDeduplicator creates a new deduplicator
func NewDeduplicator(client *Client, ttl time.Duration, logger *zap.Logger) *Deduplicator {
	return &Deduplicator{
		client: client,
		logger: logger,
		ttl:    ttl,
	}
}

// IsDuplicate checks if a message has already been processed
func (d *Deduplicator) IsDuplicate(ctx context.Context, messageID string) (bool, error) {
	key := fmt.Sprintf("dedup:%s", messageID)
	exists, err := d.client.Exists(ctx, key)
	if err != nil {
		return false, fmt.Errorf("failed to check duplicate: %w", err)
	}
	return exists, nil
}

// MarkProcessed marks a message as processed
func (d *Deduplicator) MarkProcessed(ctx context.Context, messageID string) error {
	key := fmt.Sprintf("dedup:%s", messageID)
	return d.client.Set(ctx, key, "1", d.ttl)
}

// CheckAndMark atomically checks and marks a message
func (d *Deduplicator) CheckAndMark(ctx context.Context, messageID string) (bool, error) {
	key := d.client.key(fmt.Sprintf("dedup:%s", messageID))
	
	// Use SETNX for atomic check-and-set
	result, err := d.client.rdb.SetNX(ctx, key, "1", d.ttl).Result()
	if err != nil {
		return false, fmt.Errorf("failed to check and mark: %w", err)
	}

	// result is true if key was set (not duplicate), false if key already existed (duplicate)
	return !result, nil
}

// DistributedLock implements distributed locking using Redis
type DistributedLock struct {
	client *Client
	logger *zap.Logger
}

// NewDistributedLock creates a new distributed lock
func NewDistributedLock(client *Client, logger *zap.Logger) *DistributedLock {
	return &DistributedLock{
		client: client,
		logger: logger,
	}
}

// Lock acquires a lock with the given name and TTL
func (l *DistributedLock) Lock(ctx context.Context, name string, ttl time.Duration) (bool, error) {
	key := fmt.Sprintf("lock:%s", name)
	result, err := l.client.rdb.SetNX(ctx, l.client.key(key), "1", ttl).Result()
	if err != nil {
		return false, fmt.Errorf("failed to acquire lock: %w", err)
	}
	return result, nil
}

// Unlock releases a lock
func (l *DistributedLock) Unlock(ctx context.Context, name string) error {
	key := fmt.Sprintf("lock:%s", name)
	return l.client.Delete(ctx, key)
}

// TryLock attempts to acquire a lock, returning immediately
func (l *DistributedLock) TryLock(ctx context.Context, name string, ttl time.Duration) (bool, error) {
	return l.Lock(ctx, name, ttl)
}

// SessionCache caches session data
type SessionCache struct {
	client *Client
	logger *zap.Logger
	ttl    time.Duration
}

// NewSessionCache creates a new session cache
func NewSessionCache(client *Client, ttl time.Duration, logger *zap.Logger) *SessionCache {
	return &SessionCache{
		client: client,
		logger: logger,
		ttl:    ttl,
	}
}

// Set stores session data
func (s *SessionCache) Set(ctx context.Context, sessionID string, data interface{}) error {
	key := fmt.Sprintf("session:%s", sessionID)
	return s.client.SetJSON(ctx, key, data, s.ttl)
}

// Get retrieves session data
func (s *SessionCache) Get(ctx context.Context, sessionID string, dest interface{}) error {
	key := fmt.Sprintf("session:%s", sessionID)
	return s.client.GetJSON(ctx, key, dest)
}

// Delete removes session data
func (s *SessionCache) Delete(ctx context.Context, sessionID string) error {
	key := fmt.Sprintf("session:%s", sessionID)
	return s.client.Delete(ctx, key)
}

// Refresh extends the session TTL
func (s *SessionCache) Refresh(ctx context.Context, sessionID string) error {
	key := fmt.Sprintf("session:%s", sessionID)
	return s.client.Expire(ctx, key, s.ttl)
}

