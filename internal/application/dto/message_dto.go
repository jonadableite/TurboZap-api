package dto

import (
	"time"

	"github.com/google/uuid"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
)

// SendTextRequest represents a request to send a text message
type SendTextRequest struct {
	To          string   `json:"to" validate:"required"`
	Text        string   `json:"text" validate:"required,min=1"`
	QuoteID     string   `json:"quote_id,omitempty"`
	MentionJIDs []string `json:"mention_jids,omitempty"`
}

// SendMediaRequest represents a request to send a media message
type SendMediaRequest struct {
	To       string `json:"to" validate:"required"`
	MediaURL string `json:"media_url,omitempty"`
	Base64   string `json:"base64,omitempty"`
	MimeType string `json:"mime_type,omitempty"`
	FileName string `json:"file_name,omitempty"`
	Caption  string `json:"caption,omitempty"`
	QuoteID  string `json:"quote_id,omitempty"`
}

// SendAudioRequest represents a request to send an audio message
type SendAudioRequest struct {
	To       string `json:"to" validate:"required"`
	AudioURL string `json:"audio_url,omitempty"`
	Base64   string `json:"base64,omitempty"`
	PTT      bool   `json:"ptt"` // Push-to-talk (voice message)
	QuoteID  string `json:"quote_id,omitempty"`
}

// SendStickerRequest represents a request to send a sticker
type SendStickerRequest struct {
	To         string `json:"to" validate:"required"`
	StickerURL string `json:"sticker_url,omitempty"`
	Base64     string `json:"base64,omitempty"`
}

// SendLocationRequest represents a request to send a location
type SendLocationRequest struct {
	To        string  `json:"to" validate:"required"`
	Latitude  float64 `json:"latitude" validate:"required"`
	Longitude float64 `json:"longitude" validate:"required"`
	Name      string  `json:"name,omitempty"`
	Address   string  `json:"address,omitempty"`
}

// SendContactRequest represents a request to send contacts
type SendContactRequest struct {
	To       string               `json:"to" validate:"required"`
	Contacts []ContactCardRequest `json:"contacts" validate:"required,min=1"`
}

// ContactCardRequest represents a contact card
type ContactCardRequest struct {
	FullName     string `json:"full_name" validate:"required"`
	DisplayName  string `json:"display_name"`
	Phone        string `json:"phone" validate:"required"`
	Organization string `json:"organization,omitempty"`
}

// SendReactionRequest represents a request to send a reaction
type SendReactionRequest struct {
	To        string `json:"to" validate:"required"`
	MessageID string `json:"message_id" validate:"required"`
	Emoji     string `json:"emoji"` // Empty to remove reaction
}

// SendPollRequest represents a request to send a poll
type SendPollRequest struct {
	To              string   `json:"to" validate:"required"`
	Question        string   `json:"question" validate:"required,min=1,max=255"`
	Options         []string `json:"options" validate:"required,min=2,max=12"`
	SelectableCount int      `json:"selectable_count,omitempty"` // Default: 1
}

// SendButtonRequest represents a request to send a button message
type SendButtonRequest struct {
	To       string                `json:"to" validate:"required"`
	Text     string                `json:"text" validate:"required"`
	Footer   string                `json:"footer,omitempty"`
	Buttons  []ButtonRequest       `json:"buttons" validate:"required,min=1,max=3"`
	Header   *MessageHeaderRequest `json:"header,omitempty"`
	MediaURL string                `json:"media_url,omitempty"`
	MimeType string                `json:"mime_type,omitempty"`
}

// MessageHeaderRequest represents a header for interactive messages
type MessageHeaderRequest struct {
	Type     string `json:"type" validate:"required,oneof=text image video document"`
	Text     string `json:"text,omitempty"`
	MediaURL string `json:"media_url,omitempty"`
	Base64   string `json:"base64,omitempty"`
	MimeType string `json:"mime_type,omitempty"`
	FileName string `json:"file_name,omitempty"`
}

// ButtonRequest represents a button
type ButtonRequest struct {
	ID   string `json:"id" validate:"required"`
	Text string `json:"text" validate:"required,max=20"`
	Type string `json:"type,omitempty"` // RESPONSE, URL, CALL
}

// SendListRequest represents a request to send a list message
type SendListRequest struct {
	To          string               `json:"to" validate:"required"`
	Title       string               `json:"title" validate:"required,max=60"`
	Description string               `json:"description,omitempty"`
	ButtonText  string               `json:"button_text" validate:"required,max=20"`
	Footer      string               `json:"footer,omitempty"`
	Sections    []ListSectionRequest `json:"sections" validate:"required,min=1,max=10"`
}

// ListSectionRequest represents a section in a list
type ListSectionRequest struct {
	Title string           `json:"title" validate:"required,max=24"`
	Rows  []ListRowRequest `json:"rows" validate:"required,min=1,max=10"`
}

// ListRowRequest represents a row in a list section
type ListRowRequest struct {
	ID          string `json:"id" validate:"required"`
	Title       string `json:"title" validate:"required,max=24"`
	Description string `json:"description,omitempty"`
}

// SendCarouselRequest represents a request to send a carousel message
type SendCarouselRequest struct {
	To    string                `json:"to" validate:"required"`
	Cards []CarouselCardRequest `json:"cards" validate:"required,min=1,max=10"`
}

// CarouselCardRequest represents a card in a carousel
type CarouselCardRequest struct {
	Title       string          `json:"title" validate:"required"`
	Description string          `json:"description,omitempty"`
	MediaURL    string          `json:"media_url" validate:"required"`
	Buttons     []ButtonRequest `json:"buttons,omitempty"`
}

// SendStoryRequest represents a request to send a story/status
type SendStoryRequest struct {
	MediaURL        string `json:"media_url,omitempty"`
	Base64          string `json:"base64,omitempty"`
	MimeType        string `json:"mime_type,omitempty"`
	Caption         string `json:"caption,omitempty"`
	Text            string `json:"text,omitempty"`
	BackgroundColor string `json:"background_color,omitempty"`
	Font            int    `json:"font,omitempty"`
}

// MessageResponse represents the response after sending a message
type MessageResponse struct {
	ID        uuid.UUID `json:"id"`
	MessageID string    `json:"message_id"`
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
}

// MessageReceivedEvent represents a received message event
type MessageReceivedEvent struct {
	MessageID     string    `json:"message_id"`
	From          string    `json:"from"`
	FromName      string    `json:"from_name,omitempty"`
	To            string    `json:"to"`
	IsGroup       bool      `json:"is_group"`
	Type          string    `json:"type"`
	Content       string    `json:"content,omitempty"`
	MediaURL      string    `json:"media_url,omitempty"`
	MediaMimeType string    `json:"media_mime_type,omitempty"`
	Caption       string    `json:"caption,omitempty"`
	QuotedMsgID   string    `json:"quoted_msg_id,omitempty"`
	Timestamp     time.Time `json:"timestamp"`
}

// MessageAckEvent represents a message acknowledgment event
type MessageAckEvent struct {
	MessageID string    `json:"message_id"`
	From      string    `json:"from"`
	Status    string    `json:"status"` // sent, delivered, read
	Timestamp time.Time `json:"timestamp"`
}

// MessageDeleteEvent represents a deleted message
type MessageDeleteEvent struct {
	MessageID string    `json:"message_id"`
	Chat      string    `json:"chat"`
	Actor     string    `json:"actor,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}

// MessageUpdateEvent represents updated message metadata
type MessageUpdateEvent struct {
	MessageID string    `json:"message_id"`
	Chat      string    `json:"chat"`
	Timestamp time.Time `json:"timestamp"`
}

// MessageSentEvent represents an outgoing message
type MessageSentEvent struct {
	MessageID string    `json:"message_id"`
	To        string    `json:"to"`
	Type      string    `json:"type"`
	Timestamp time.Time `json:"timestamp"`
}

// SyncSummaryData represents history sync summaries
type SyncSummaryData struct {
	Resource string `json:"resource"`
	Count    int    `json:"count"`
	SyncType string `json:"sync_type"`
}

// ContactUpdateEvent represents contact metadata changes
type ContactUpdateEvent struct {
	JID      string `json:"jid"`
	PushName string `json:"push_name,omitempty"`
	Event    string `json:"event"`
}

// GroupMetadataEvent represents detailed group updates
type GroupMetadataEvent struct {
	GroupJID  string    `json:"group_jid"`
	Event     string    `json:"event"`
	Actor     string    `json:"actor,omitempty"`
	Timestamp time.Time `json:"timestamp"`
	Subject   string    `json:"subject,omitempty"`
	Topic     string    `json:"topic,omitempty"`
	Join      []string  `json:"join,omitempty"`
	Leave     []string  `json:"leave,omitempty"`
	Promote   []string  `json:"promote,omitempty"`
	Demote    []string  `json:"demote,omitempty"`
}

// ToMessageResponse converts an entity to response DTO
func ToMessageResponse(msg *entity.Message, waMessageID string) MessageResponse {
	return MessageResponse{
		ID:        msg.ID,
		MessageID: waMessageID,
		Status:    string(msg.Status),
		Timestamp: msg.Timestamp,
	}
}
