package webhook

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
	"github.com/jonadableite/turbozap-api/pkg/config"
	"go.uber.org/zap"
)

// Dispatcher handles webhook event dispatching
type Dispatcher struct {
	config      config.WebhookConfig
	logger      *zap.Logger
	webhookRepo repository.WebhookRepository
	instanceMap map[uuid.UUID]string // maps instance ID to instance name
	httpClient  *http.Client
	mu          sync.RWMutex
}

// NewDispatcher creates a new webhook dispatcher
func NewDispatcher(cfg config.WebhookConfig, logger *zap.Logger) *Dispatcher {
	return &Dispatcher{
		config:      cfg,
		logger:      logger,
		instanceMap: make(map[uuid.UUID]string),
		httpClient: &http.Client{
			Timeout: time.Duration(cfg.Timeout) * time.Second,
		},
	}
}

// SetWebhookRepository sets the webhook repository
func (d *Dispatcher) SetWebhookRepository(repo repository.WebhookRepository) {
	d.webhookRepo = repo
}

// RegisterInstance registers an instance for webhook dispatching
func (d *Dispatcher) RegisterInstance(instanceID uuid.UUID, instanceName string) {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.instanceMap[instanceID] = instanceName
}

// UnregisterInstance removes an instance from webhook dispatching
func (d *Dispatcher) UnregisterInstance(instanceID uuid.UUID) {
	d.mu.Lock()
	defer d.mu.Unlock()
	delete(d.instanceMap, instanceID)
}

// Dispatch sends an event to the configured webhook
func (d *Dispatcher) Dispatch(instanceID uuid.UUID, event entity.WebhookEvent, data interface{}) {
	go d.dispatchAsync(instanceID, event, data)
}

func (d *Dispatcher) dispatchAsync(instanceID uuid.UUID, event entity.WebhookEvent, data interface{}) {
	if d.webhookRepo == nil {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(d.config.Timeout)*time.Second)
	defer cancel()

	// Get webhook config for instance
	webhook, err := d.webhookRepo.GetByInstance(ctx, instanceID)
	if err != nil {
		d.logger.Error("Failed to get webhook config",
			zap.String("instance_id", instanceID.String()),
			zap.Error(err),
		)
		return
	}

	if webhook == nil || !webhook.Enabled {
		return
	}

	// Check if event is subscribed
	if !webhook.ShouldTrigger(event) {
		return
	}

	// Get instance name
	d.mu.RLock()
	instanceName := d.instanceMap[instanceID]
	d.mu.RUnlock()

	// Build payload
	payload := entity.WebhookPayload{
		Event:      event,
		InstanceID: instanceID.String(),
		Instance:   instanceName,
		Timestamp:  time.Now(),
		Data:       data,
	}

	// Send webhook with retries
	d.sendWithRetry(ctx, webhook, payload)
}

func (d *Dispatcher) sendWithRetry(ctx context.Context, webhook *entity.Webhook, payload entity.WebhookPayload) {
	var lastErr error

	for attempt := 0; attempt <= d.config.RetryCount; attempt++ {
		if attempt > 0 {
			// Exponential backoff
			backoff := time.Duration(attempt*attempt) * time.Second
			select {
			case <-ctx.Done():
				return
			case <-time.After(backoff):
			}
		}

		err := d.send(ctx, webhook, payload)
		if err == nil {
			d.logger.Debug("Webhook delivered successfully",
				zap.String("url", webhook.URL),
				zap.String("event", string(payload.Event)),
			)
			return
		}

		lastErr = err
		d.logger.Warn("Webhook delivery failed",
			zap.String("url", webhook.URL),
			zap.String("event", string(payload.Event)),
			zap.Int("attempt", attempt+1),
			zap.Error(err),
		)
	}

	d.logger.Error("Webhook delivery failed after all retries",
		zap.String("url", webhook.URL),
		zap.String("event", string(payload.Event)),
		zap.Error(lastErr),
	)
}

func (d *Dispatcher) send(ctx context.Context, webhook *entity.Webhook, payload entity.WebhookPayload) error {
	// Marshal payload
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	// Create request
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, webhook.URL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "TurboZap-Webhook/1.0")
	req.Header.Set("X-Webhook-Event", string(payload.Event))
	req.Header.Set("X-Instance-ID", payload.InstanceID)

	// Add custom headers
	for key, value := range webhook.Headers {
		req.Header.Set(key, value)
	}

	// Send request
	resp, err := d.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	// Check status code
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	return nil
}

// DispatchBatch sends multiple events at once
func (d *Dispatcher) DispatchBatch(instanceID uuid.UUID, events []struct {
	Event entity.WebhookEvent
	Data  interface{}
}) {
	for _, e := range events {
		d.Dispatch(instanceID, e.Event, e.Data)
	}
}
