package webhook

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
	"github.com/jonadableite/turbozap-api/pkg/config"
	"github.com/sirupsen/logrus"
)

// Dispatcher handles webhook event dispatching
type Dispatcher struct {
	config      config.WebhookConfig
	logger      *logrus.Logger
	webhookRepo repository.WebhookRepository
	instanceMap map[uuid.UUID]string // maps instance ID to instance name
	httpClient  *http.Client
	mu          sync.RWMutex
}

// NewDispatcher creates a new webhook dispatcher
func NewDispatcher(cfg config.WebhookConfig, logger *logrus.Logger) *Dispatcher {
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
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(d.config.Timeout)*time.Second)
	defer cancel()

	d.mu.RLock()
	instanceName := d.instanceMap[instanceID]
	d.mu.RUnlock()

	payload := entity.WebhookPayload{
		Event:      event,
		InstanceID: instanceID.String(),
		Instance:   instanceName,
		Timestamp:  time.Now(),
		Data:       data,
	}

	d.dispatchInstanceWebhook(ctx, instanceID, payload)
	d.dispatchGlobalWebhook(ctx, payload)
}

func (d *Dispatcher) dispatchInstanceWebhook(ctx context.Context, instanceID uuid.UUID, payload entity.WebhookPayload) {
	if d.webhookRepo == nil {
		return
	}

	webhook, err := d.webhookRepo.GetByInstance(ctx, instanceID)
	if err != nil {
		d.logger.WithError(err).WithFields(logrus.Fields{
			"instance_id": instanceID.String(),
		}).Error("Failed to get webhook config")
		return
	}

	if webhook == nil || !webhook.Enabled {
		return
	}

	if !webhook.ShouldTrigger(payload.Event) {
		return
	}

	target := webhookTarget{
		URL:       webhook.URL,
		Headers:   webhook.Headers,
		ByEvents:  webhook.WebhookByEvents,
		UseBase64: webhook.UseBase64,
		Label:     "instance",
	}

	d.sendWithRetry(ctx, target, payload)
}

func (d *Dispatcher) dispatchGlobalWebhook(ctx context.Context, payload entity.WebhookPayload) {
	if !d.config.GlobalEnabled || d.config.GlobalURL == "" {
		return
	}

	if len(d.config.GlobalEvents) > 0 {
		allowed, ok := d.config.GlobalEvents[payload.Event.Slug()]
		if !ok || !allowed {
			return
		}
	}

	target := webhookTarget{
		URL:       d.config.GlobalURL,
		Headers:   nil,
		ByEvents:  d.config.GlobalWebhookByEvents,
		UseBase64: d.config.GlobalBase64,
		Label:     "global",
	}

	d.sendWithRetry(ctx, target, payload)
}

func (d *Dispatcher) sendWithRetry(ctx context.Context, target webhookTarget, payload entity.WebhookPayload) {
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

		err := d.send(ctx, target, payload)
		if err == nil {
			d.logger.WithFields(logrus.Fields{
				"url":    target.URL,
				"event":  string(payload.Event),
				"target": target.Label,
			}).Debug("Webhook delivered successfully")
			return
		}

		lastErr = err
		d.logger.WithError(err).WithFields(logrus.Fields{
			"url":     target.URL,
			"event":   string(payload.Event),
			"attempt": attempt + 1,
			"target":  target.Label,
		}).Warn("Webhook delivery failed")
	}

	d.logger.WithError(lastErr).WithFields(logrus.Fields{
		"url":    target.URL,
		"event":  string(payload.Event),
		"target": target.Label,
	}).Error("Webhook delivery failed after all retries")
}

func (d *Dispatcher) send(ctx context.Context, target webhookTarget, payload entity.WebhookPayload) error {
	// Marshal payload
	body, contentType, err := encodePayload(payload, target.UseBase64)
	if err != nil {
		return err
	}

	url := target.URL
	if target.ByEvents {
		url = appendEventSlug(url, payload.Event)
	}

	// Create request
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("User-Agent", "TurboZap-Webhook/1.0")
	req.Header.Set("X-Webhook-Event", string(payload.Event))
	req.Header.Set("X-Instance-ID", payload.InstanceID)
	if target.UseBase64 {
		req.Header.Set("X-Content-Transfer-Encoding", "base64")
	}

	// Add custom headers
	for key, value := range target.Headers {
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

type webhookTarget struct {
	URL       string
	Headers   map[string]string
	ByEvents  bool
	UseBase64 bool
	Label     string
}

func appendEventSlug(base string, event entity.WebhookEvent) string {
	base = strings.TrimSpace(base)
	if base == "" {
		return base
	}

	slug := event.Slug()
	if slug == "" {
		return base
	}

	base = strings.TrimRight(base, "/")
	return fmt.Sprintf("%s/%s", base, slug)
}

func encodePayload(payload entity.WebhookPayload, useBase64 bool) ([]byte, string, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, "", fmt.Errorf("failed to marshal payload: %w", err)
	}

	if !useBase64 {
		return body, "application/json", nil
	}

	encoded := base64.StdEncoding.EncodeToString(body)
	return []byte(encoded), "text/plain", nil
}
