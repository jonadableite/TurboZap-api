package whatsapp

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jonadableite/turbozap-api/internal/application/dto"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	"github.com/sirupsen/logrus"
)

// EventHandler handles WhatsApp events for a client
type EventHandler struct {
	instanceID   uuid.UUID
	instanceName string
	logger       *logrus.Logger
	dispatcher   WebhookDispatcher
	messageRepo  repository.MessageRepository
	waClient     *whatsmeow.Client
	onQRCode     func(string)
	onConnected  func(string, string, string)
	onDisconnect func()
}

// WebhookDispatcher interface for dispatching webhook events
type WebhookDispatcher interface {
	Dispatch(instanceID uuid.UUID, event entity.WebhookEvent, data interface{})
	RegisterInstance(instanceID uuid.UUID, instanceName string)
}

// NewEventHandler creates a new event handler
func NewEventHandler(instanceID uuid.UUID, instanceName string, logger *logrus.Logger, dispatcher WebhookDispatcher, messageRepo repository.MessageRepository) *EventHandler {
	return &EventHandler{
		instanceID:   instanceID,
		instanceName: instanceName,
		logger:       logger,
		dispatcher:   dispatcher,
		messageRepo:  messageRepo,
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

// SetWAClient sets the WhatsApp client reference
func (h *EventHandler) SetWAClient(client *whatsmeow.Client) {
	h.waClient = client
}

// Handle processes WhatsApp events
func (h *EventHandler) Handle(evt interface{}) {
	defer func() {
		if r := recover(); r != nil {
			h.logger.WithFields(logrus.Fields{
				"instance":  h.instanceName,
				"panic":     r,
				"eventType": fmt.Sprintf("%T", evt),
			}).Warn("Handle: recovered from panic while processing event")
		}
	}()

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
	h.logger.WithFields(logrus.Fields{
		"instance": h.instanceName,
	}).Info("QR code received")

	// Generate QR code image
	generator := NewQRCodeGenerator()
	qrImage, err := generator.Generate(qrCode, 256)
	if err != nil {
		h.logger.WithError(err).Error("Failed to generate QR code image")
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
	h.logger.WithFields(logrus.Fields{
		"instance": h.instanceName,
	}).Info("Connected to WhatsApp")

	// Get connection info from client
	var phone, name, pic string
	if h.waClient != nil && h.waClient.Store.ID != nil {
		jid := h.waClient.Store.ID
		phone = jid.User
		name = h.waClient.Store.PushName

		// Get profile picture
		ctx := context.Background()
		picInfo, err := h.waClient.GetProfilePictureInfo(ctx, jid.ToNonAD(), &whatsmeow.GetProfilePictureParams{})
		if err == nil && picInfo != nil {
			pic = picInfo.URL
		}
	}

	// Call connected handler to update client state
	if h.onConnected != nil {
		h.onConnected(phone, name, pic)
	}

	// Dispatch webhook
	h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventConnectionUpdate, dto.ConnectionUpdateData{
		Status: "connected",
	})
}

func (h *EventHandler) handleDisconnected(evt *events.Disconnected) {
	defer func() {
		if r := recover(); r != nil {
			h.logger.WithFields(logrus.Fields{
				"instance": h.instanceName,
				"panic":    r,
			}).Warn("handleDisconnected: recovered from panic")
		}
	}()

	h.logger.WithFields(logrus.Fields{
		"instance": h.instanceName,
	}).Info("Disconnected from WhatsApp")

	if h.onDisconnect != nil {
		// Call disconnect handler with error handling
		func() {
			defer func() {
				if r := recover(); r != nil {
					h.logger.WithFields(logrus.Fields{
						"instance": h.instanceName,
						"panic":    r,
					}).Warn("handleDisconnected: recovered from panic in onDisconnect callback")
				}
			}()
			h.onDisconnect()
		}()
	}

	// Dispatch webhook with error handling
	func() {
		defer func() {
			if r := recover(); r != nil {
					h.logger.WithFields(logrus.Fields{
						"instance": h.instanceName,
						"panic":    r,
					}).Warn("handleDisconnected: recovered from panic in webhook dispatch")
			}
		}()
		h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventConnectionUpdate, dto.ConnectionUpdateData{
			Status: "disconnected",
		})
	}()
}

func (h *EventHandler) handleLoggedOut(evt *events.LoggedOut) {
	defer func() {
		if r := recover(); r != nil {
			h.logger.WithFields(logrus.Fields{
				"instance": h.instanceName,
				"panic":    r,
			}).Warn("handleLoggedOut: recovered from panic")
		}
	}()

	h.logger.WithFields(logrus.Fields{
		"instance": h.instanceName,
		"reason":   evt.Reason.String(),
	}).Info("Logged out from WhatsApp")

	if h.onDisconnect != nil {
		// Call disconnect handler with error handling
		func() {
			defer func() {
				if r := recover(); r != nil {
					h.logger.WithFields(logrus.Fields{
						"instance": h.instanceName,
						"panic":    r,
					}).Warn("handleLoggedOut: recovered from panic in onDisconnect callback")
				}
			}()
			h.onDisconnect()
		}()
	}

	// Dispatch webhook with error handling
	func() {
		defer func() {
			if r := recover(); r != nil {
					h.logger.WithFields(logrus.Fields{
						"instance": h.instanceName,
						"panic":    r,
					}).Warn("handleLoggedOut: recovered from panic in webhook dispatch")
			}
		}()
		h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventConnectionUpdate, dto.ConnectionUpdateData{
			Status: "logged_out",
		})
	}()
}

func (h *EventHandler) handleMessage(evt *events.Message) {
	// Skip if no message info
	if evt.Info.ID == "" {
		return
	}

	msg := evt.Message
	if msg == nil {
		return
	}

	if h.handleProtocolMessage(evt, msg.ProtocolMessage) {
		return
	}

	h.handleInteractiveResponses(evt, msg)

	// Build message event data
	msgEvent := dto.MessageReceivedEvent{
		MessageID: evt.Info.ID,
		From:      evt.Info.Sender.String(),
		To:        evt.Info.Chat.String(),
		FromMe:    evt.Info.IsFromMe,
		IsGroup:   evt.Info.IsGroup,
		Timestamp: evt.Info.Timestamp,
	}

	// Get sender name
	if evt.Info.PushName != "" {
		msgEvent.FromName = evt.Info.PushName
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

	h.logger.WithFields(logrus.Fields{
		"instance": h.instanceName,
		"id":       msgEvent.MessageID,
		"type":    msgEvent.Type,
		"from":    msgEvent.From,
	}).Debug("Message received")

	// Save message to database
	if h.messageRepo != nil {
		go func() {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()

			message := entity.NewMessage(
				h.instanceID,
				msgEvent.To,
				entity.MessageType(msgEvent.Type),
			)
			message.MessageID = msgEvent.MessageID
			message.RemoteJID = msgEvent.From
			message.FromMe = msgEvent.FromMe
			message.Content = msgEvent.Content
			message.MediaCaption = msgEvent.Caption
			message.MediaMimeType = msgEvent.MediaMimeType
			message.QuotedMsgID = msgEvent.QuotedMsgID
			message.Timestamp = msgEvent.Timestamp
			message.Status = entity.MessageStatusSent

			if err := h.messageRepo.Create(ctx, message); err != nil {
				h.logger.WithError(err).Warn("Failed to save message to database")
			}
		}()
	}

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
		eventData := dto.MessageAckEvent{
			MessageID: msgID,
			From:      evt.Chat.String(),
			Status:    status,
			Timestamp: evt.Timestamp,
		}

		h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventMessagesUpdate, eventData)
		h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventMessageAck, eventData)
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
	metadata := dto.GroupMetadataEvent{
		GroupJID:  evt.JID.String(),
		Event:     "group_info_update",
		Timestamp: evt.Timestamp,
		Join:      jidsToStrings(evt.Join),
		Leave:     jidsToStrings(evt.Leave),
		Promote:   jidsToStrings(evt.Promote),
		Demote:    jidsToStrings(evt.Demote),
	}

	if evt.Sender != nil {
		metadata.Actor = evt.Sender.String()
	}
	if evt.Name != nil {
		metadata.Subject = evt.Name.Name
	}
	if evt.Topic != nil {
		metadata.Topic = evt.Topic.Topic
	}

	h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventGroupsUpdate, metadata)
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

	metadata := dto.GroupMetadataEvent{
		GroupJID: evt.JID.String(),
		Event:    "group_joined",
		Join:     participants,
	}
	if evt.Sender != nil {
		metadata.Actor = evt.Sender.String()
	}
	metadata.Timestamp = time.Now()

	h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventGroupsUpsert, metadata)
}

func (h *EventHandler) handleHistorySync(evt *events.HistorySync) {
	if evt.Data == nil {
		return
	}

	syncType := evt.Data.GetSyncType().String()
	h.logger.WithFields(logrus.Fields{
		"instance": h.instanceName,
		"type":     syncType,
	}).Debug("History sync received")

	if messages := evt.Data.GetStatusV3Messages(); len(messages) > 0 {
		h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventMessagesSet, dto.SyncSummaryData{
			Resource: "messages",
			Count:    len(messages),
			SyncType: syncType,
		})
	}

	if contacts := evt.Data.GetPushnames(); len(contacts) > 0 {
		summary := dto.SyncSummaryData{
			Resource: "contacts",
			Count:    len(contacts),
			SyncType: syncType,
		}
		h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventContactsSet, summary)
		h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventContactsUpsert, summary)
	}

	if chats := evt.Data.GetConversations(); len(chats) > 0 {
		h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventChatsSet, dto.SyncSummaryData{
			Resource: "chats",
			Count:    len(chats),
			SyncType: syncType,
		})
	}
}

func (h *EventHandler) handlePushName(evt *events.PushName) {
	h.logger.WithFields(logrus.Fields{
		"instance": h.instanceName,
		"jid":      evt.JID.String(),
		"name":     evt.NewPushName,
	}).Debug("Push name update")

	h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventContactsUpdate, dto.ContactUpdateEvent{
		JID:      evt.JID.String(),
		PushName: evt.NewPushName,
		Event:    "push_name",
	})
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

func (h *EventHandler) handleInteractiveResponses(evt *events.Message, msg *waE2E.Message) {
	if msg == nil {
		return
	}

	if resp := msg.ButtonsResponseMessage; resp != nil {
		h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventButtonResponse, dto.ButtonResponseData{
			MessageID:  evt.Info.ID,
			From:       evt.Info.Sender.String(),
			ButtonID:   resp.GetSelectedButtonID(),
			ButtonText: resp.GetSelectedDisplayText(),
		})
	}

	if resp := msg.ListResponseMessage; resp != nil {
		if single := resp.GetSingleSelectReply(); single != nil {
			h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventListResponse, dto.ListResponseData{
				MessageID:   evt.Info.ID,
				From:        evt.Info.Sender.String(),
				RowID:       single.GetSelectedRowID(),
				Title:       resp.GetTitle(),
				Description: resp.GetDescription(),
			})
		}
	}
}

func (h *EventHandler) handleProtocolMessage(evt *events.Message, protocolMsg *waE2E.ProtocolMessage) bool {
	if protocolMsg == nil {
		return false
	}

	key := protocolMsg.GetKey()
	if key == nil {
		return false
	}

	chatJID := key.GetRemoteJID()

	switch protocolMsg.GetType() {
	case waE2E.ProtocolMessage_REVOKE:
		h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventMessagesDelete, dto.MessageDeleteEvent{
			MessageID: key.GetID(),
			Chat:      chatJID,
			Actor:     evt.Info.Sender.String(),
			Timestamp: evt.Info.Timestamp,
		})
		return true
	case waE2E.ProtocolMessage_MESSAGE_EDIT:
		h.dispatcher.Dispatch(h.instanceID, entity.WebhookEventMessagesUpdate, dto.MessageUpdateEvent{
			MessageID: key.GetID(),
			Chat:      chatJID,
			Timestamp: evt.Info.Timestamp,
		})
		return true
	default:
		return false
	}
}

func jidsToStrings(jids []types.JID) []string {
	if len(jids) == 0 {
		return nil
	}

	out := make([]string, len(jids))
	for i, jid := range jids {
		out[i] = jid.String()
	}
	return out
}
