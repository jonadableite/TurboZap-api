package whatsapp

import (
	"time"

	"github.com/google/uuid"
	"github.com/jonadableite/turbozap-api/internal/application/dto"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	"go.uber.org/zap"
)

// EventHandler handles WhatsApp events for a client
type EventHandler struct {
	instanceID   uuid.UUID
	instanceName string
	logger       *zap.Logger
	dispatcher   WebhookDispatcher
	onQRCode     func(string)
	onConnected  func(string, string, string)
	onDisconnect func()
}

// WebhookDispatcher interface for dispatching webhook events
type WebhookDispatcher interface {
	Dispatch(instanceID uuid.UUID, event entity.WebhookEvent, data interface{})
}

// NewEventHandler creates a new event handler
func NewEventHandler(instanceID uuid.UUID, instanceName string, logger *zap.Logger, dispatcher WebhookDispatcher) *EventHandler {
	return &EventHandler{
		instanceID:   instanceID,
		instanceName: instanceName,
		logger:       logger,
		dispatcher:   dispatcher,
	}
}

// SetQRCodeHandler sets the QR code callback
func (h *EventHandler) SetQRCodeHandler(handler func(string)) {
	h.onQRCode = handler
}

// SetConnectedHandler sets the connected callback
func (h *EventHandler) SetConnectedHandler(handler func(string, string, string)) {
	h.onConnected = handler
}

// SetDisconnectHandler sets the disconnect callback
func (h *EventHandler) SetDisconnectHandler(handler func()) {
	h.onDisconnect = handler
}

// Handle processes WhatsApp events
func (h *EventHandler) Handle(evt interface{}) {
	switch v := evt.(type) {
	case *events.QR:
		h.handleQR(v)
	case *events.Connected:
		h.handleConnected(v)
	case *events.Disconnected:
		h.handleDisconnected(v)
	case *events.LoggedOut:
		h.handleLoggedOut(v)
	case *events.Message:
		h.handleMessage(v)
	case *events.Receipt:
		h.handleReceipt(v)
	case *events.Presence:
		h.handlePresence(v)
	case *events.GroupInfo:
		h.handleGroupInfo(v)
	case *events.JoinedGroup:
		h.handleJoinedGroup(v)
	case *events.HistorySync:
		h.handleHistorySync(v)
	case *events.PushName:
		h.handlePushName(v)
	}
}

func (h *EventHandler) handleQR(evt *events.QR) {
	if len(evt.Codes) == 0 {
		return
	}

	qrCode := evt.Codes[0]
	h.logger.Info("QR code received", zap.String("instance", h.instanceName))

	// Generate QR code image
	generator := NewQRCodeGenerator()
	qrImage, err := generator.Generate(qrCode, 256)
	if err != nil {
		h.logger.Error("Failed to generate QR code image", zap.Error(err))
		return
	}

	// Call QR code handler
	if h.onQRCode != nil {
		h.onQRCode(qrImage)
	}

	// Dispatch webhook
	h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventQRCodeUpdated, dto.QRCodeUpdateData{
		QRCode: qrImage,
		Code:   qrCode,
	})
}

func (h *EventHandler) handleConnected(evt *events.Connected) {
	h.logger.Info("Connected to WhatsApp", zap.String("instance", h.instanceName))

	// Dispatch webhook
	h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventConnectionUpdate, dto.ConnectionUpdateData{
		Status: "connected",
	})
}

func (h *EventHandler) handleDisconnected(evt *events.Disconnected) {
	h.logger.Info("Disconnected from WhatsApp", zap.String("instance", h.instanceName))

	if h.onDisconnect != nil {
		h.onDisconnect()
	}

	// Dispatch webhook
	h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventConnectionUpdate, dto.ConnectionUpdateData{
		Status: "disconnected",
	})
}

func (h *EventHandler) handleLoggedOut(evt *events.LoggedOut) {
	h.logger.Info("Logged out from WhatsApp",
		zap.String("instance", h.instanceName),
		zap.String("reason", evt.Reason.String()),
	)

	if h.onDisconnect != nil {
		h.onDisconnect()
	}

	// Dispatch webhook
	h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventConnectionUpdate, dto.ConnectionUpdateData{
		Status: "logged_out",
	})
}

func (h *EventHandler) handleMessage(evt *events.Message) {
	// Skip if no message info
	if evt.Info.ID == "" {
		return
	}

	// Build message event data
	msgEvent := dto.MessageReceivedEvent{
		MessageID:   evt.Info.ID,
		From:        evt.Info.Sender.String(),
		To:          evt.Info.Chat.String(),
		IsGroup:     evt.Info.IsGroup,
		Timestamp:   evt.Info.Timestamp,
	}

	// Get sender name
	if evt.Info.PushName != "" {
		msgEvent.FromName = evt.Info.PushName
	}

	// Determine message type and content
	msg := evt.Message
	if msg == nil {
		return
	}

	switch {
	case msg.Conversation != nil && *msg.Conversation != "":
		msgEvent.Type = "text"
		msgEvent.Content = *msg.Conversation
	case msg.ExtendedTextMessage != nil:
		msgEvent.Type = "text"
		msgEvent.Content = msg.ExtendedTextMessage.GetText()
		if msg.ExtendedTextMessage.ContextInfo != nil {
			msgEvent.QuotedMsgID = msg.ExtendedTextMessage.ContextInfo.GetStanzaID()
		}
	case msg.ImageMessage != nil:
		msgEvent.Type = "image"
		msgEvent.Caption = msg.ImageMessage.GetCaption()
		msgEvent.MediaMimeType = msg.ImageMessage.GetMimetype()
	case msg.VideoMessage != nil:
		msgEvent.Type = "video"
		msgEvent.Caption = msg.VideoMessage.GetCaption()
		msgEvent.MediaMimeType = msg.VideoMessage.GetMimetype()
	case msg.AudioMessage != nil:
		msgEvent.Type = "audio"
		msgEvent.MediaMimeType = msg.AudioMessage.GetMimetype()
	case msg.DocumentMessage != nil:
		msgEvent.Type = "document"
		msgEvent.Caption = msg.DocumentMessage.GetCaption()
		msgEvent.MediaMimeType = msg.DocumentMessage.GetMimetype()
	case msg.StickerMessage != nil:
		msgEvent.Type = "sticker"
		msgEvent.MediaMimeType = msg.StickerMessage.GetMimetype()
	case msg.LocationMessage != nil:
		msgEvent.Type = "location"
	case msg.ContactMessage != nil:
		msgEvent.Type = "contact"
	case msg.ReactionMessage != nil:
		msgEvent.Type = "reaction"
		msgEvent.Content = msg.ReactionMessage.GetText()
	case msg.PollCreationMessage != nil:
		msgEvent.Type = "poll"
		msgEvent.Content = msg.PollCreationMessage.GetName()
	case msg.ButtonsMessage != nil:
		msgEvent.Type = "button"
	case msg.ListMessage != nil:
		msgEvent.Type = "list"
	default:
		msgEvent.Type = "unknown"
	}

	h.logger.Debug("Message received",
		zap.String("instance", h.instanceName),
		zap.String("id", msgEvent.MessageID),
		zap.String("type", msgEvent.Type),
		zap.String("from", msgEvent.From),
	)

	// Dispatch webhook
	h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventMessageReceived, msgEvent)
}

func (h *EventHandler) handleReceipt(evt *events.Receipt) {
	status := "unknown"
	switch evt.Type {
	case types.ReceiptTypeDelivered:
		status = "delivered"
	case types.ReceiptTypeRead:
		status = "read"
	case types.ReceiptTypePlayed:
		status = "played"
	}

	for _, msgID := range evt.MessageIDs {
		h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventMessageAck, dto.MessageAckEvent{
			MessageID: msgID,
			From:      evt.Chat.String(),
			Status:    status,
			Timestamp: evt.Timestamp,
		})
	}
}

func (h *EventHandler) handlePresence(evt *events.Presence) {
	presence := "available"
	if evt.Unavailable {
		presence = "unavailable"
	}

	var lastSeen int64
	if !evt.LastSeen.IsZero() {
		lastSeen = evt.LastSeen.Unix()
	}

	h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventPresenceUpdate, dto.PresenceUpdateData{
		JID:      evt.From.String(),
		Presence: presence,
		LastSeen: lastSeen,
	})
}

func (h *EventHandler) handleGroupInfo(evt *events.GroupInfo) {
	h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventGroupUpdate, map[string]interface{}{
		"group_jid": evt.JID.String(),
		"event":     "group_info_update",
		"timestamp": time.Now().Unix(),
	})
}

func (h *EventHandler) handleJoinedGroup(evt *events.JoinedGroup) {
	participants := make([]string, len(evt.GroupInfo.Participants))
	for i, p := range evt.GroupInfo.Participants {
		participants[i] = p.JID.String()
	}

	h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventGroupParticipants, dto.GroupParticipantsUpdateData{
		GroupJID:     evt.JID.String(),
		Participants: participants,
		Action:       "join",
	})
}

func (h *EventHandler) handleHistorySync(evt *events.HistorySync) {
	h.logger.Debug("History sync received",
		zap.String("instance", h.instanceName),
		zap.String("type", evt.Data.GetSyncType().String()),
	)
}

func (h *EventHandler) handlePushName(evt *events.PushName) {
	h.logger.Debug("Push name update",
		zap.String("instance", h.instanceName),
		zap.String("jid", evt.JID.String()),
		zap.String("name", evt.NewPushName),
	)
}

// extractTextFromMessage extracts text content from a message
func extractTextFromMessage(msg *waE2E.Message) string {
	if msg == nil {
		return ""
	}

	if msg.Conversation != nil {
		return *msg.Conversation
	}

	if msg.ExtendedTextMessage != nil {
		return msg.ExtendedTextMessage.GetText()
	}

	if msg.ImageMessage != nil {
		return msg.ImageMessage.GetCaption()
	}

	if msg.VideoMessage != nil {
		return msg.VideoMessage.GetCaption()
	}

	if msg.DocumentMessage != nil {
		return msg.DocumentMessage.GetCaption()
	}

	return ""
}

