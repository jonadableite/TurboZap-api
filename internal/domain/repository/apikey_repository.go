package repository

import (
	"context"
	"time"

	"github.com/jonadableite/turbozap-api/internal/domain/entity"
)

// ApiKeyRepository defines operations for managing user API keys.
type ApiKeyRepository interface {
	Create(ctx context.Context, key *entity.ApiKey) error
	GetByKey(ctx context.Context, key string) (*entity.ApiKey, error)
	GetByUserID(ctx context.Context, userID string) ([]*entity.ApiKey, error)
	GetByID(ctx context.Context, id string) (*entity.ApiKey, error)
	Update(ctx context.Context, key *entity.ApiKey) error
	Delete(ctx context.Context, id string) error
	UpdateLastUsed(ctx context.Context, id string, ts time.Time) error
}
