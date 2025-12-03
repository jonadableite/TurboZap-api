package dto

import (
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
)

// SetWebhookRequest represents a request to set webhook configuration
type SetWebhookRequest struct {
	URL     string                `json:"url" validate:"required,url"`
	Events  []entity.WebhookEvent `json:"events,omitempty"`
	Headers map[string]string     `json:"headers,omitempty"`
	Enabled *bool                 `json:"enabled,omitempty"`
}

// GetWebhookResponse represents the webhook configuration response
type GetWebhookResponse struct {
	URL     string                `json:"url"`
	Events  []entity.WebhookEvent `json:"events"`
	Headers map[string]string     `json:"headers,omitempty"`
	Enabled bool                  `json:"enabled"`
}

// WebhookEventPayload represents the payload sent to webhooks
type WebhookEventPayload struct {
	Event      string      `json:"event"`
	InstanceID string      `json:"instance_id"`
	Instance   string      `json:"instance"`
	Timestamp  int64       `json:"timestamp"`
	Data       interface{} `json:"data"`
}

// ConnectionUpdateData represents connection update event data
type ConnectionUpdateData struct {
	Status      string `json:"status"`
	PhoneNumber string `json:"phone_number,omitempty"`
	ProfileName string `json:"profile_name,omitempty"`
	ProfilePic  string `json:"profile_pic,omitempty"`
}

// QRCodeUpdateData represents QR code update event data
type QRCodeUpdateData struct {
	QRCode string `json:"qr_code"` // Base64 encoded QR code image
	Code   string `json:"code"`    // Raw QR code string
}

// GroupParticipantsUpdateData represents group participants update event data
type GroupParticipantsUpdateData struct {
	GroupJID     string   `json:"group_jid"`
	Participants []string `json:"participants"`
	Action       string   `json:"action"` // join, leave, promote, demote
}

// PresenceUpdateData represents presence update event data
type PresenceUpdateData struct {
	JID      string `json:"jid"`
	Presence string `json:"presence"` // available, unavailable, composing, recording
	LastSeen int64  `json:"last_seen,omitempty"`
}

// CallEventData represents call event data
type CallEventData struct {
	CallID    string `json:"call_id"`
	From      string `json:"from"`
	Timestamp int64  `json:"timestamp"`
	IsVideo   bool   `json:"is_video"`
	Status    string `json:"status"` // ringing, missed, answered, rejected
}

// PollVoteData represents poll vote event data
type PollVoteData struct {
	MessageID       string `json:"message_id"`
	Voter           string `json:"voter"`
	SelectedOptions []int  `json:"selected_options"`
}

// ButtonResponseData represents button response event data
type ButtonResponseData struct {
	MessageID  string `json:"message_id"`
	From       string `json:"from"`
	ButtonID   string `json:"button_id"`
	ButtonText string `json:"button_text"`
}

// ListResponseData represents list response event data
type ListResponseData struct {
	MessageID   string `json:"message_id"`
	From        string `json:"from"`
	RowID       string `json:"row_id"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
}

// ToGetWebhookResponse converts an entity to response DTO
func ToGetWebhookResponse(webhook *entity.Webhook) GetWebhookResponse {
	return GetWebhookResponse{
		URL:     webhook.URL,
		Events:  webhook.Events,
		Headers: webhook.Headers,
		Enabled: webhook.Enabled,
	}
}
