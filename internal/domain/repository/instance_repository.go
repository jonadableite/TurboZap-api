package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
)

// InstanceRepository defines the interface for instance data access
type InstanceRepository interface {
	// Create creates a new instance
	Create(ctx context.Context, instance *entity.Instance) error

	// GetByID retrieves an instance by ID
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Instance, error)

	// GetByName retrieves an instance by name
	GetByName(ctx context.Context, name string) (*entity.Instance, error)

	// GetByAPIKey retrieves an instance by API key
	GetByAPIKey(ctx context.Context, apiKey string) (*entity.Instance, error)

	// GetAll retrieves all instances
	GetAll(ctx context.Context) ([]*entity.Instance, error)

	// Update updates an instance
	Update(ctx context.Context, instance *entity.Instance) error

	// UpdateStatus updates only the status of an instance
	UpdateStatus(ctx context.Context, id uuid.UUID, status entity.InstanceStatus) error

	// Delete deletes an instance
	Delete(ctx context.Context, id uuid.UUID) error

	// Exists checks if an instance with the given name exists
	Exists(ctx context.Context, name string) (bool, error)
}

