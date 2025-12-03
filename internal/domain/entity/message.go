package entity

import (
	"time"

	"github.com/google/uuid"
)

// MessageType represents the type of message
type MessageType string

const (
	MessageTypeText     MessageType = "text"
	MessageTypeImage    MessageType = "image"
	MessageTypeVideo    MessageType = "video"
	MessageTypeAudio    MessageType = "audio"
	MessageTypeDocument MessageType = "document"
	MessageTypeSticker  MessageType = "sticker"
	MessageTypeLocation MessageType = "location"
	MessageTypeContact  MessageType = "contact"
	MessageTypeReaction MessageType = "reaction"
	MessageTypePoll     MessageType = "poll"
	MessageTypeButton   MessageType = "button"
	MessageTypeList     MessageType = "list"
	MessageTypeCarousel MessageType = "carousel"
	MessageTypeStory    MessageType = "story"
)

// MessageStatus represents the delivery status of a message
type MessageStatus string

const (
	MessageStatusPending   MessageStatus = "pending"
	MessageStatusSent      MessageStatus = "sent"
	MessageStatusDelivered MessageStatus = "delivered"
	MessageStatusRead      MessageStatus = "read"
	MessageStatusFailed    MessageStatus = "failed"
)

// Message represents a WhatsApp message
type Message struct {
	ID            uuid.UUID     `json:"id"`
	InstanceID    uuid.UUID     `json:"instance_id"`
	MessageID     string        `json:"message_id"`
	RemoteJID     string        `json:"remote_jid"`
	FromMe        bool          `json:"from_me"`
	Type          MessageType   `json:"type"`
	Status        MessageStatus `json:"status"`
	Content       string        `json:"content,omitempty"`
	MediaURL      string        `json:"media_url,omitempty"`
	MediaMimeType string        `json:"media_mime_type,omitempty"`
	MediaCaption  string        `json:"media_caption,omitempty"`
	QuotedMsgID   string        `json:"quoted_msg_id,omitempty"`
	Timestamp     time.Time     `json:"timestamp"`
	CreatedAt     time.Time     `json:"created_at"`
}

// NewMessage creates a new message entity
func NewMessage(instanceID uuid.UUID, remoteJID string, msgType MessageType) *Message {
	now := time.Now()
	return &Message{
		ID:         uuid.New(),
		InstanceID: instanceID,
		RemoteJID:  remoteJID,
		FromMe:     true,
		Type:       msgType,
		Status:     MessageStatusPending,
		Timestamp:  now,
		CreatedAt:  now,
	}
}

// TextMessage represents a text message request
type TextMessage struct {
	To      string `json:"to"`
	Text    string `json:"text"`
	QuoteID string `json:"quote_id,omitempty"`
}

// MediaMessage represents a media message request
type MediaMessage struct {
	To       string `json:"to"`
	MediaURL string `json:"media_url,omitempty"`
	Base64   string `json:"base64,omitempty"`
	MimeType string `json:"mime_type,omitempty"`
	FileName string `json:"file_name,omitempty"`
	Caption  string `json:"caption,omitempty"`
	QuoteID  string `json:"quote_id,omitempty"`
}

// AudioMessage represents an audio message request
type AudioMessage struct {
	To       string `json:"to"`
	AudioURL string `json:"audio_url,omitempty"`
	Base64   string `json:"base64,omitempty"`
	PTT      bool   `json:"ptt"` // Push-to-talk (voice message)
	QuoteID  string `json:"quote_id,omitempty"`
}

// StickerMessage represents a sticker message request
type StickerMessage struct {
	To         string `json:"to"`
	StickerURL string `json:"sticker_url,omitempty"`
	Base64     string `json:"base64,omitempty"`
}

// LocationMessage represents a location message request
type LocationMessage struct {
	To        string  `json:"to"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Name      string  `json:"name,omitempty"`
	Address   string  `json:"address,omitempty"`
}

// ContactMessage represents a contact message request
type ContactMessage struct {
	To       string  `json:"to"`
	Contacts []VCard `json:"contacts"`
}

// VCard represents a contact card
type VCard struct {
	FullName     string `json:"full_name"`
	DisplayName  string `json:"display_name"`
	Phone        string `json:"phone"`
	Organization string `json:"organization,omitempty"`
}

// ReactionMessage represents a reaction message request
type ReactionMessage struct {
	To        string `json:"to"`
	MessageID string `json:"message_id"`
	Emoji     string `json:"emoji"` // Empty to remove reaction
}

// PollMessage represents a poll message request
type PollMessage struct {
	To              string   `json:"to"`
	Question        string   `json:"question"`
	Options         []string `json:"options"`
	SelectableCount int      `json:"selectable_count"` // How many options can be selected
}

// ButtonMessage represents a button message request
type ButtonMessage struct {
	To       string   `json:"to"`
	Text     string   `json:"text"`
	Footer   string   `json:"footer,omitempty"`
	Buttons  []Button `json:"buttons"`
	MediaURL string   `json:"media_url,omitempty"`
	MimeType string   `json:"mime_type,omitempty"`
}

// Button represents a button in a button message
type Button struct {
	ID   string `json:"id"`
	Text string `json:"text"`
}

// ListMessage represents a list message request
type ListMessage struct {
	To          string        `json:"to"`
	Title       string        `json:"title"`
	Description string        `json:"description"`
	ButtonText  string        `json:"button_text"`
	Footer      string        `json:"footer,omitempty"`
	Sections    []ListSection `json:"sections"`
}

// ListSection represents a section in a list message
type ListSection struct {
	Title string    `json:"title"`
	Rows  []ListRow `json:"rows"`
}

// ListRow represents a row in a list section
type ListRow struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
}

// CarouselMessage represents a carousel message request (Product carousel)
type CarouselMessage struct {
	To    string         `json:"to"`
	Cards []CarouselCard `json:"cards"`
}

// CarouselCard represents a card in a carousel message
type CarouselCard struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	MediaURL    string   `json:"media_url"`
	Buttons     []Button `json:"buttons,omitempty"`
}

// StoryMessage represents a story/status message request
type StoryMessage struct {
	MediaURL string `json:"media_url,omitempty"`
	Base64   string `json:"base64,omitempty"`
	MimeType string `json:"mime_type,omitempty"`
	Caption  string `json:"caption,omitempty"`
	// For text stories
	Text            string `json:"text,omitempty"`
	BackgroundColor string `json:"background_color,omitempty"`
	Font            int    `json:"font,omitempty"`
}
