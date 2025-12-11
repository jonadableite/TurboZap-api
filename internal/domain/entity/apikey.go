package entity

import (
	"time"
)

// ApiKey represents a user-owned API key for accessing the TurboZap API.
// Fields mirror the database table `api_keys`.
type ApiKey struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Key         string     `json:"key"`
	UserID      string     `json:"user_id"`
	Permissions []string   `json:"permissions,omitempty"`
	LastUsedAt  *time.Time `json:"last_used_at,omitempty"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	RevokedAt   *time.Time `json:"revoked_at,omitempty"`
}

// IsExpired returns true if the key has an expiration date in the past.
func (k *ApiKey) IsExpired(now time.Time) bool {
	if k.ExpiresAt == nil {
		return false
	}
	return now.After(*k.ExpiresAt)
}

// IsRevoked returns true if the key has been revoked.
func (k *ApiKey) IsRevoked() bool {
	return k.RevokedAt != nil
}

// IsValid combines revocation and expiration checks.
func (k *ApiKey) IsValid(now time.Time) bool {
	return !k.IsRevoked() && !k.IsExpired(now)
}
