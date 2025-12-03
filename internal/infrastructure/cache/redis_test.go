package cache

import (
	"context"
	"testing"
	"time"
)

func TestRateLimiter_Allow(t *testing.T) {
	// Skip if no Redis connection
	t.Skip("Skipping test that requires Redis connection")

	// This test would run against a real Redis instance
	// In CI, use testcontainers or mock Redis
}

func TestDeduplicator_CheckAndMark(t *testing.T) {
	// Skip if no Redis connection
	t.Skip("Skipping test that requires Redis connection")
}

func TestRateLimitResult(t *testing.T) {
	tests := []struct {
		name        string
		result      RateLimitResult
		wantAllowed bool
	}{
		{
			name: "allowed request",
			result: RateLimitResult{
				Allowed:   true,
				Remaining: 59,
				ResetAt:   time.Now().Add(time.Minute),
			},
			wantAllowed: true,
		},
		{
			name: "blocked request",
			result: RateLimitResult{
				Allowed:   false,
				Remaining: 0,
				ResetAt:   time.Now().Add(time.Minute),
			},
			wantAllowed: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.result.Allowed != tt.wantAllowed {
				t.Errorf("Allowed = %v, want %v", tt.result.Allowed, tt.wantAllowed)
			}
		})
	}
}

// MockRedisClient for unit tests without real Redis
type MockRedisClient struct {
	data map[string]string
}

func NewMockRedisClient() *MockRedisClient {
	return &MockRedisClient{
		data: make(map[string]string),
	}
}

func (m *MockRedisClient) Get(ctx context.Context, key string) (string, error) {
	if v, ok := m.data[key]; ok {
		return v, nil
	}
	return "", nil
}

func (m *MockRedisClient) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	m.data[key] = value.(string)
	return nil
}

func (m *MockRedisClient) Delete(ctx context.Context, keys ...string) error {
	for _, k := range keys {
		delete(m.data, k)
	}
	return nil
}

func (m *MockRedisClient) Exists(ctx context.Context, key string) (bool, error) {
	_, ok := m.data[key]
	return ok, nil
}

