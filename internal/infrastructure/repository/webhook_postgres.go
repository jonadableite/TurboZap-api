package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
)

// webhookPostgresRepository implements WebhookRepository using PostgreSQL
type webhookPostgresRepository struct {
	pool *pgxpool.Pool
}

// NewWebhookPostgresRepository creates a new PostgreSQL-based webhook repository
func NewWebhookPostgresRepository(pool *pgxpool.Pool) repository.WebhookRepository {
	return &webhookPostgresRepository{pool: pool}
}

// Create creates a new webhook configuration
func (r *webhookPostgresRepository) Create(ctx context.Context, webhook *entity.Webhook) error {
	if webhook.Headers == nil {
		webhook.Headers = make(map[string]string)
	}

	headersJSON, err := json.Marshal(webhook.Headers)
	if err != nil {
		return fmt.Errorf("failed to marshal headers: %w", err)
	}

	events := make([]string, len(webhook.Events))
	for i, e := range webhook.Events {
		events[i] = string(e)
	}

	query := `
		INSERT INTO webhooks (id, instance_id, url, events, headers, enabled, webhook_by_events, webhook_base64, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	_, err = r.pool.Exec(ctx, query,
		webhook.ID,
		webhook.InstanceID,
		webhook.URL,
		events,
		headersJSON,
		webhook.Enabled,
		webhook.WebhookByEvents,
		webhook.UseBase64,
		webhook.CreatedAt,
		webhook.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create webhook: %w", err)
	}
	return nil
}

// GetByID retrieves a webhook by ID
func (r *webhookPostgresRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Webhook, error) {
	query := `
		SELECT id, instance_id, url, events, headers, enabled, webhook_by_events, webhook_base64, created_at, updated_at
		FROM webhooks WHERE id = $1
	`
	return r.scanWebhook(ctx, query, id)
}

// GetByInstance retrieves webhook configuration for an instance
func (r *webhookPostgresRepository) GetByInstance(ctx context.Context, instanceID uuid.UUID) (*entity.Webhook, error) {
	query := `
		SELECT id, instance_id, url, events, headers, enabled, webhook_by_events, webhook_base64, created_at, updated_at
		FROM webhooks WHERE instance_id = $1
	`
	return r.scanWebhook(ctx, query, instanceID)
}

// Update updates a webhook configuration
func (r *webhookPostgresRepository) Update(ctx context.Context, webhook *entity.Webhook) error {
	if webhook.Headers == nil {
		webhook.Headers = make(map[string]string)
	}

	headersJSON, err := json.Marshal(webhook.Headers)
	if err != nil {
		return fmt.Errorf("failed to marshal headers: %w", err)
	}

	events := make([]string, len(webhook.Events))
	for i, e := range webhook.Events {
		events[i] = string(e)
	}

	query := `
		UPDATE webhooks 
		SET url = $2, events = $3, headers = $4, enabled = $5, webhook_by_events = $6, webhook_base64 = $7, updated_at = $8
		WHERE id = $1
	`
	webhook.UpdatedAt = time.Now()
	_, err = r.pool.Exec(ctx, query,
		webhook.ID,
		webhook.URL,
		events,
		headersJSON,
		webhook.Enabled,
		webhook.WebhookByEvents,
		webhook.UseBase64,
		webhook.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to update webhook: %w", err)
	}
	return nil
}

// Upsert creates or updates a webhook configuration
func (r *webhookPostgresRepository) Upsert(ctx context.Context, webhook *entity.Webhook) error {
	if webhook.Headers == nil {
		webhook.Headers = make(map[string]string)
	}

	headersJSON, err := json.Marshal(webhook.Headers)
	if err != nil {
		return fmt.Errorf("failed to marshal headers: %w", err)
	}

	events := make([]string, len(webhook.Events))
	for i, e := range webhook.Events {
		events[i] = string(e)
	}

	now := time.Now()
	webhook.UpdatedAt = now

	query := `
		INSERT INTO webhooks (id, instance_id, url, events, headers, enabled, webhook_by_events, webhook_base64, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (instance_id) DO UPDATE SET
			url = EXCLUDED.url,
			events = EXCLUDED.events,
			headers = EXCLUDED.headers,
			enabled = EXCLUDED.enabled,
			webhook_by_events = EXCLUDED.webhook_by_events,
			webhook_base64 = EXCLUDED.webhook_base64,
			updated_at = EXCLUDED.updated_at
	`
	_, err = r.pool.Exec(ctx, query,
		webhook.ID,
		webhook.InstanceID,
		webhook.URL,
		events,
		headersJSON,
		webhook.Enabled,
		webhook.WebhookByEvents,
		webhook.UseBase64,
		webhook.CreatedAt,
		webhook.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to upsert webhook: %w", err)
	}
	return nil
}

// Delete deletes a webhook configuration
func (r *webhookPostgresRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM webhooks WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete webhook: %w", err)
	}
	return nil
}

// DeleteByInstance deletes webhook configuration for an instance
func (r *webhookPostgresRepository) DeleteByInstance(ctx context.Context, instanceID uuid.UUID) error {
	query := `DELETE FROM webhooks WHERE instance_id = $1`
	_, err := r.pool.Exec(ctx, query, instanceID)
	if err != nil {
		return fmt.Errorf("failed to delete webhook by instance: %w", err)
	}
	return nil
}

// SetEnabled enables or disables a webhook
func (r *webhookPostgresRepository) SetEnabled(ctx context.Context, id uuid.UUID, enabled bool) error {
	query := `UPDATE webhooks SET enabled = $2, updated_at = $3 WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id, enabled, time.Now())
	if err != nil {
		return fmt.Errorf("failed to set webhook enabled: %w", err)
	}
	return nil
}

// Helper function to scan a single webhook
func (r *webhookPostgresRepository) scanWebhook(ctx context.Context, query string, args ...interface{}) (*entity.Webhook, error) {
	row := r.pool.QueryRow(ctx, query, args...)

	var webhook entity.Webhook
	var events []string
	var headersJSON []byte

	err := row.Scan(
		&webhook.ID,
		&webhook.InstanceID,
		&webhook.URL,
		&events,
		&headersJSON,
		&webhook.Enabled,
		&webhook.WebhookByEvents,
		&webhook.UseBase64,
		&webhook.CreatedAt,
		&webhook.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to scan webhook: %w", err)
	}

	// Convert string events to WebhookEvent
	webhook.Events = make([]entity.WebhookEvent, len(events))
	for i, e := range events {
		webhook.Events[i] = entity.WebhookEvent(e)
	}

	// Parse headers JSON
	if len(headersJSON) > 0 {
		if err := json.Unmarshal(headersJSON, &webhook.Headers); err != nil {
			return nil, fmt.Errorf("failed to unmarshal headers: %w", err)
		}
	}

	return &webhook, nil
}
