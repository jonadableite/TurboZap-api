package entity

import (
	"strings"
	"time"

	"github.com/google/uuid"
)

// WebhookEvent represents the type of webhook event
type WebhookEvent string

const (
	WebhookEventApplicationStartup      WebhookEvent = "application.startup"
	WebhookEventQRCodeUpdated           WebhookEvent = "qrcode.updated"
	WebhookEventConnectionUpdate        WebhookEvent = "connection.update"
	WebhookEventMessagesSet             WebhookEvent = "messages.set"
	WebhookEventMessagesUpsert          WebhookEvent = "messages.upsert"
	WebhookEventMessagesUpdate          WebhookEvent = "messages.update"
	WebhookEventMessagesDelete          WebhookEvent = "messages.delete"
	WebhookEventSendMessage             WebhookEvent = "send.message"
	WebhookEventMessageAck              WebhookEvent = "message.ack"
	WebhookEventMessageRevoked          WebhookEvent = "message.revoked"
	WebhookEventContactsSet             WebhookEvent = "contacts.set"
	WebhookEventContactsUpsert          WebhookEvent = "contacts.upsert"
	WebhookEventContactsUpdate          WebhookEvent = "contacts.update"
	WebhookEventPresenceUpdate          WebhookEvent = "presence.update"
	WebhookEventChatsSet                WebhookEvent = "chats.set"
	WebhookEventChatsUpdate             WebhookEvent = "chats.update"
	WebhookEventChatsUpsert             WebhookEvent = "chats.upsert"
	WebhookEventChatsDelete             WebhookEvent = "chats.delete"
	WebhookEventGroupsUpsert            WebhookEvent = "groups.upsert"
	WebhookEventGroupsUpdate            WebhookEvent = "groups.update"
	WebhookEventGroupParticipantsUpdate WebhookEvent = "group.participants.update"
	WebhookEventCallReceived            WebhookEvent = "call.received"
	WebhookEventCallMissed              WebhookEvent = "call.missed"
	WebhookEventPollVote                WebhookEvent = "poll.vote"
	WebhookEventButtonResponse          WebhookEvent = "button.response"
	WebhookEventListResponse            WebhookEvent = "list.response"
	WebhookEventStoryViewed             WebhookEvent = "story.viewed"
	WebhookEventTypebotStart            WebhookEvent = "typebot.start"
	WebhookEventTypebotChangeStatus     WebhookEvent = "typebot.change_status"
	WebhookEventNewJWT                  WebhookEvent = "new.jwt"
	WebhookEventErrors                  WebhookEvent = "errors"
)

const (
	// Backwards compatibility aliases
	WebhookEventMessageReceived   WebhookEvent = WebhookEventMessagesUpsert
	WebhookEventMessageSent       WebhookEvent = WebhookEventSendMessage
	WebhookEventGroupParticipants WebhookEvent = WebhookEventGroupParticipantsUpdate
	WebhookEventGroupUpdate       WebhookEvent = WebhookEventGroupsUpdate
)

var allWebhookEvents = []WebhookEvent{
	WebhookEventApplicationStartup,
	WebhookEventQRCodeUpdated,
	WebhookEventConnectionUpdate,
	WebhookEventMessagesSet,
	WebhookEventMessagesUpsert,
	WebhookEventMessagesUpdate,
	WebhookEventMessagesDelete,
	WebhookEventSendMessage,
	WebhookEventMessageAck,
	WebhookEventMessageRevoked,
	WebhookEventContactsSet,
	WebhookEventContactsUpsert,
	WebhookEventContactsUpdate,
	WebhookEventPresenceUpdate,
	WebhookEventChatsSet,
	WebhookEventChatsUpdate,
	WebhookEventChatsUpsert,
	WebhookEventChatsDelete,
	WebhookEventGroupsUpsert,
	WebhookEventGroupsUpdate,
	WebhookEventGroupParticipantsUpdate,
	WebhookEventCallReceived,
	WebhookEventCallMissed,
	WebhookEventPollVote,
	WebhookEventButtonResponse,
	WebhookEventListResponse,
	WebhookEventStoryViewed,
	WebhookEventTypebotStart,
	WebhookEventTypebotChangeStatus,
	WebhookEventNewJWT,
	WebhookEventErrors,
}

var webhookEventBySlug = func() map[string]WebhookEvent {
	idx := make(map[string]WebhookEvent)
	for _, evt := range allWebhookEvents {
		idx[evt.Slug()] = evt
	}
	return idx
}()

// AllWebhookEvents returns all available webhook events
func AllWebhookEvents() []WebhookEvent {
	events := make([]WebhookEvent, len(allWebhookEvents))
	copy(events, allWebhookEvents)
	return events
}

// Webhook represents a webhook configuration
type Webhook struct {
	ID              uuid.UUID         `json:"id"`
	InstanceID      uuid.UUID         `json:"instance_id"`
	URL             string            `json:"url"`
	Events          []WebhookEvent    `json:"events"`
	Enabled         bool              `json:"enabled"`
	Headers         map[string]string `json:"headers,omitempty"`
	WebhookByEvents bool              `json:"webhook_by_events"`
	UseBase64       bool              `json:"webhook_base64"`
	CreatedAt       time.Time         `json:"created_at"`
	UpdatedAt       time.Time         `json:"updated_at"`
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
		Headers:    make(map[string]string),
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

// Slug returns the kebab-case version used in URLs/config
func (e WebhookEvent) Slug() string {
	return strings.ReplaceAll(string(e), ".", "-")
}

// EventFromSlug returns the event constant for a slug string
func EventFromSlug(slug string) (WebhookEvent, bool) {
	slug = strings.ToLower(slug)
	event, ok := webhookEventBySlug[slug]
	return event, ok
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
