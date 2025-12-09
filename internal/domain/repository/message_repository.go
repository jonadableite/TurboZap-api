package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
)

// MessageRepository defines the interface for message data access
type MessageRepository interface {
	// Create creates a new message record
	Create(ctx context.Context, message *entity.Message) error

	// GetByID retrieves a message by ID
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Message, error)

	// GetByMessageID retrieves a message by WhatsApp message ID
	GetByMessageID(ctx context.Context, instanceID uuid.UUID, messageID string) (*entity.Message, error)

	// GetByInstance retrieves all messages for an instance
	GetByInstance(ctx context.Context, instanceID uuid.UUID, limit, offset int) ([]*entity.Message, error)

	// GetByRemoteJID retrieves messages for a specific chat
	GetByRemoteJID(ctx context.Context, instanceID uuid.UUID, remoteJID string, limit, offset int) ([]*entity.Message, error)

	// GetByDateRange retrieves messages within a date range
	GetByDateRange(ctx context.Context, instanceID uuid.UUID, start, end time.Time) ([]*entity.Message, error)

	// UpdateStatus updates the status of a message
	UpdateStatus(ctx context.Context, id uuid.UUID, status entity.MessageStatus) error

	// UpdateStatusByMessageID updates the status using WhatsApp message ID
	UpdateStatusByMessageID(ctx context.Context, instanceID uuid.UUID, messageID string, status entity.MessageStatus) error

	// Delete deletes a message
	Delete(ctx context.Context, id uuid.UUID) error

	// DeleteByInstance deletes all messages for an instance
	DeleteByInstance(ctx context.Context, instanceID uuid.UUID) error

	// CountToday counts messages sent/received today
	CountToday(ctx context.Context, instanceID *uuid.UUID) (int64, error)

	// CountTodayByInstances counts messages sent/received today for multiple instances
	CountTodayByInstances(ctx context.Context, instanceIDs []uuid.UUID) (int64, error)

	// CountTotal counts total messages
	CountTotal(ctx context.Context, instanceID *uuid.UUID) (int64, error)

	// CountTotalByInstances counts total messages for multiple instances
	CountTotalByInstances(ctx context.Context, instanceIDs []uuid.UUID) (int64, error)

	// CountByDateRange counts messages within a date range
	CountByDateRange(ctx context.Context, instanceID *uuid.UUID, start, end time.Time) (int64, error)
}
