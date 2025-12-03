package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
)

// WebhookRepository defines the interface for webhook data access
type WebhookRepository interface {
	// Create creates a new webhook configuration
	Create(ctx context.Context, webhook *entity.Webhook) error

	// GetByID retrieves a webhook by ID
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Webhook, error)

	// GetByInstance retrieves webhook configuration for an instance
	GetByInstance(ctx context.Context, instanceID uuid.UUID) (*entity.Webhook, error)

	// Update updates a webhook configuration
	Update(ctx context.Context, webhook *entity.Webhook) error

	// Upsert creates or updates a webhook configuration
	Upsert(ctx context.Context, webhook *entity.Webhook) error

	// Delete deletes a webhook configuration
	Delete(ctx context.Context, id uuid.UUID) error

	// DeleteByInstance deletes webhook configuration for an instance
	DeleteByInstance(ctx context.Context, instanceID uuid.UUID) error

	// SetEnabled enables or disables a webhook
	SetEnabled(ctx context.Context, id uuid.UUID, enabled bool) error
}
