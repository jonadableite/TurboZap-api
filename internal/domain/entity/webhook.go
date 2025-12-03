package entity

import (
	"time"

	"github.com/google/uuid"
)

// WebhookEvent represents the type of webhook event
type WebhookEvent string

const (
	WebhookEventMessageReceived   WebhookEvent = "message.received"
	WebhookEventMessageSent       WebhookEvent = "message.sent"
	WebhookEventMessageAck        WebhookEvent = "message.ack"
	WebhookEventMessageRevoked    WebhookEvent = "message.revoked"
	WebhookEventConnectionUpdate  WebhookEvent = "connection.update"
	WebhookEventQRCodeUpdated     WebhookEvent = "qrcode.updated"
	WebhookEventGroupParticipants WebhookEvent = "group.participants.update"
	WebhookEventGroupUpdate       WebhookEvent = "group.update"
	WebhookEventPresenceUpdate    WebhookEvent = "presence.update"
	WebhookEventCallReceived      WebhookEvent = "call.received"
	WebhookEventCallMissed        WebhookEvent = "call.missed"
	WebhookEventPollVote          WebhookEvent = "poll.vote"
	WebhookEventButtonResponse    WebhookEvent = "button.response"
	WebhookEventListResponse      WebhookEvent = "list.response"
	WebhookEventStoryViewed       WebhookEvent = "story.viewed"
)

// AllWebhookEvents returns all available webhook events
func AllWebhookEvents() []WebhookEvent {
	return []WebhookEvent{
		WebhookEventMessageReceived,
		WebhookEventMessageSent,
		WebhookEventMessageAck,
		WebhookEventMessageRevoked,
		WebhookEventConnectionUpdate,
		WebhookEventQRCodeUpdated,
		WebhookEventGroupParticipants,
		WebhookEventGroupUpdate,
		WebhookEventPresenceUpdate,
		WebhookEventCallReceived,
		WebhookEventCallMissed,
		WebhookEventPollVote,
		WebhookEventButtonResponse,
		WebhookEventListResponse,
		WebhookEventStoryViewed,
	}
}

// Webhook represents a webhook configuration
type Webhook struct {
	ID         uuid.UUID         `json:"id"`
	InstanceID uuid.UUID         `json:"instance_id"`
	URL        string            `json:"url"`
	Events     []WebhookEvent    `json:"events"`
	Enabled    bool              `json:"enabled"`
	Headers    map[string]string `json:"headers,omitempty"`
	CreatedAt  time.Time         `json:"created_at"`
	UpdatedAt  time.Time         `json:"updated_at"`
}

// NewWebhook creates a new webhook entity
func NewWebhook(instanceID uuid.UUID, url string, events []WebhookEvent) *Webhook {
	now := time.Now()

	// If no events specified, subscribe to all
	if len(events) == 0 {
		events = AllWebhookEvents()
	}

	return &Webhook{
		ID:         uuid.New(),
		InstanceID: instanceID,
		URL:        url,
		Events:     events,
		Enabled:    true,
		CreatedAt:  now,
		UpdatedAt:  now,
	}
}

// ShouldTrigger returns true if the webhook should be triggered for the given event
func (w *Webhook) ShouldTrigger(event WebhookEvent) bool {
	if !w.Enabled {
		return false
	}

	for _, e := range w.Events {
		if e == event {
			return true
		}
	}
	return false
}

// WebhookPayload represents the payload sent to webhooks
type WebhookPayload struct {
	Event      WebhookEvent `json:"event"`
	InstanceID string       `json:"instance_id"`
	Instance   string       `json:"instance"`
	Timestamp  time.Time    `json:"timestamp"`
	Data       interface{}  `json:"data"`
}

// SetWebhookRequest represents a request to set webhook configuration
type SetWebhookRequest struct {
	URL     string            `json:"url"`
	Events  []WebhookEvent    `json:"events,omitempty"`
	Headers map[string]string `json:"headers,omitempty"`
	Enabled bool              `json:"enabled"`
}

// GetWebhookResponse represents the webhook configuration response
type GetWebhookResponse struct {
	URL     string         `json:"url"`
	Events  []WebhookEvent `json:"events"`
	Enabled bool           `json:"enabled"`
}

// WebhookDeliveryLog represents a log of webhook delivery attempts
type WebhookDeliveryLog struct {
	ID           uuid.UUID    `json:"id"`
	WebhookID    uuid.UUID    `json:"webhook_id"`
	Event        WebhookEvent `json:"event"`
	Payload      string       `json:"payload"`
	StatusCode   int          `json:"status_code"`
	Response     string       `json:"response"`
	Success      bool         `json:"success"`
	Attempts     int          `json:"attempts"`
	ErrorMessage string       `json:"error_message,omitempty"`
	CreatedAt    time.Time    `json:"created_at"`
}
