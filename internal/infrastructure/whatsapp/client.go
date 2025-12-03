package whatsapp

import (
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
	"github.com/jonadableite/turbozap-api/pkg/config"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waCommon"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/store"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	waLog "go.mau.fi/whatsmeow/util/log"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

// Manager manages multiple WhatsApp client instances
type Manager struct {
	config     *config.Config
	logger     *zap.Logger
	dispatcher WebhookDispatcher
	container  *sqlstore.Container
	clients    map[uuid.UUID]*Client
	mu         sync.RWMutex
}

// Client represents a single WhatsApp client instance
type Client struct {
	Instance    *entity.Instance
	WAClient    *whatsmeow.Client
	Device      *store.Device
	Handler     *EventHandler
	QRCode      string
	QRCodeImage string
	Connected   bool
	mu          sync.RWMutex
}

// NewManager creates a new WhatsApp manager
func NewManager(cfg *config.Config, pool *pgxpool.Pool, logger *zap.Logger, dispatcher WebhookDispatcher) *Manager {
	// Create whatsmeow logger
	waLogger := waLog.Stdout("whatsmeow", "INFO", true)

	// Create SQL store container
	ctx := context.Background()
	dbURL := pool.Config().ConnString()
	container, err := sqlstore.New(ctx, "pgx", dbURL, waLogger)
	if err != nil {
		// Check if error is about tables already existing (schema already initialized)
		// This can happen if tables were created manually or by a previous run
		if strings.Contains(err.Error(), "already exists") {
			logger.Warn("WhatsApp store tables already exist - this is normal if schema was pre-created",
				zap.Error(err),
			)
			// The whatsmeow library should still work with existing tables
			// We'll try to continue, but if there are issues, the tables may need cleanup
		} else {
			logger.Fatal("Failed to create SQL store", zap.Error(err))
		}
	}

	return &Manager{
		config:     cfg,
		logger:     logger,
		dispatcher: dispatcher,
		container:  container,
		clients:    make(map[uuid.UUID]*Client),
	}
}

// CreateClient creates a new WhatsApp client for an instance
func (m *Manager) CreateClient(instance *entity.Instance) (*Client, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Check if client already exists
	if client, exists := m.clients[instance.ID]; exists {
		return client, nil
	}

	// Create device store
	device := m.container.NewDevice()

	// Create whatsmeow client
	waLogger := waLog.Stdout("Client-"+instance.Name, "INFO", true)
	waClient := whatsmeow.NewClient(device, waLogger)

	// Create event handler
	handler := NewEventHandler(instance.ID, instance.Name, m.logger, m.dispatcher)

	client := &Client{
		Instance: instance,
		WAClient: waClient,
		Device:   device,
		Handler:  handler,
	}

	// Set event handler callbacks
	handler.SetQRCodeHandler(func(qrCode string) {
		client.mu.Lock()
		client.QRCode = qrCode
		client.QRCodeImage = qrCode
		client.mu.Unlock()
	})

	handler.SetConnectedHandler(func(phone, name, pic string) {
		client.mu.Lock()
		client.Connected = true
		client.QRCode = ""
		client.Instance.SetConnected(phone, name, pic)
		client.mu.Unlock()
	})

	handler.SetDisconnectHandler(func() {
		client.mu.Lock()
		client.Connected = false
		client.Instance.SetDisconnected()
		client.mu.Unlock()
	})

	// Register event handler
	waClient.AddEventHandler(handler.Handle)

	// Store client
	m.clients[instance.ID] = client

	return client, nil
}

// GetClient retrieves a client by instance ID
func (m *Manager) GetClient(instanceID uuid.UUID) (*Client, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	client, exists := m.clients[instanceID]
	return client, exists
}

// GetClientByName retrieves a client by instance name
func (m *Manager) GetClientByName(name string) (*Client, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	for _, client := range m.clients {
		if client.Instance.Name == name {
			return client, true
		}
	}
	return nil, false
}

// Connect connects a client to WhatsApp
func (m *Manager) Connect(ctx context.Context, instanceID uuid.UUID) error {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return fmt.Errorf("client not found")
	}

	client.mu.Lock()
	defer client.mu.Unlock()

	// Check if already connected
	if client.WAClient.IsConnected() {
		return nil
	}

	// Connect
	err := client.WAClient.Connect()
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}

	return nil
}

// Disconnect disconnects a client from WhatsApp
func (m *Manager) Disconnect(instanceID uuid.UUID) error {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return fmt.Errorf("client not found")
	}

	client.mu.Lock()
	defer client.mu.Unlock()

	client.WAClient.Disconnect()
	client.Connected = false

	return nil
}

// Logout logs out and removes the session
func (m *Manager) Logout(instanceID uuid.UUID) error {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return fmt.Errorf("client not found")
	}

	client.mu.Lock()
	defer client.mu.Unlock()

	ctx := context.Background()
	if err := client.WAClient.Logout(ctx); err != nil {
		m.logger.Warn("Logout failed", zap.Error(err))
	}

	client.WAClient.Disconnect()
	client.Connected = false
	client.QRCode = ""

	return nil
}

// DeleteClient removes a client from the manager
func (m *Manager) DeleteClient(instanceID uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	client, exists := m.clients[instanceID]
	if !exists {
		return nil
	}

	// Disconnect and cleanup
	client.WAClient.Disconnect()

	// Delete device from store
	ctx := context.Background()
	if client.Device != nil {
		client.Device.Delete(ctx)
	}

	delete(m.clients, instanceID)
	return nil
}

// DisconnectAll disconnects all clients
func (m *Manager) DisconnectAll() {
	m.mu.Lock()
	defer m.mu.Unlock()

	for _, client := range m.clients {
		client.WAClient.Disconnect()
	}
}

// RestoreInstances restores all instances from the database
func (m *Manager) RestoreInstances(ctx context.Context, repo repository.InstanceRepository) error {
	instances, err := repo.GetAll(ctx)
	if err != nil {
		return fmt.Errorf("failed to get instances: %w", err)
	}

	for _, instance := range instances {
		if _, err := m.CreateClient(instance); err != nil {
			m.logger.Warn("Failed to create client",
				zap.String("instance", instance.Name),
				zap.Error(err),
			)
			continue
		}

		// Try to connect if it was previously connected
		if instance.Status == entity.InstanceStatusConnected {
			if err := m.Connect(ctx, instance.ID); err != nil {
				m.logger.Warn("Failed to reconnect instance",
					zap.String("instance", instance.Name),
					zap.Error(err),
				)
			}
		}
	}

	return nil
}

// GetQRCode returns the current QR code for an instance
func (m *Manager) GetQRCode(instanceID uuid.UUID) (string, string, error) {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return "", "", fmt.Errorf("client not found")
	}

	client.mu.RLock()
	defer client.mu.RUnlock()

	return client.QRCode, client.QRCodeImage, nil
}

// IsConnected checks if a client is connected
func (m *Manager) IsConnected(instanceID uuid.UUID) bool {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return false
	}

	client.mu.RLock()
	defer client.mu.RUnlock()

	return client.WAClient.IsConnected()
}

// GetConnectionInfo returns connection information
func (m *Manager) GetConnectionInfo(instanceID uuid.UUID) (phone, name, pic string, err error) {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return "", "", "", fmt.Errorf("client not found")
	}

	client.mu.RLock()
	defer client.mu.RUnlock()

	if client.WAClient.Store.ID == nil {
		return "", "", "", nil
	}

	jid := client.WAClient.Store.ID
	phone = jid.User
	name = client.WAClient.Store.PushName

	// Get profile picture
	ctx := context.Background()
	picInfo, err := client.WAClient.GetProfilePictureInfo(ctx, jid.ToNonAD(), &whatsmeow.GetProfilePictureParams{})
	if err == nil && picInfo != nil {
		pic = picInfo.URL
	}

	return phone, name, pic, nil
}

// SendText sends a text message
func (m *Manager) SendText(ctx context.Context, instanceID uuid.UUID, to, text string, quotedID string, mentions []string) (string, error) {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return "", fmt.Errorf("client not found")
	}

	jid, err := types.ParseJID(to)
	if err != nil {
		return "", fmt.Errorf("invalid JID: %w", err)
	}

	msg := &waE2E.Message{
		ExtendedTextMessage: &waE2E.ExtendedTextMessage{
			Text: proto.String(text),
		},
	}

	// Add quoted message context if provided
	if quotedID != "" {
		msg.ExtendedTextMessage.ContextInfo = &waE2E.ContextInfo{
			StanzaID:      proto.String(quotedID),
			Participant:   proto.String(jid.String()),
			QuotedMessage: &waE2E.Message{},
		}
	}

	// Add mentions
	if len(mentions) > 0 {
		if msg.ExtendedTextMessage.ContextInfo == nil {
			msg.ExtendedTextMessage.ContextInfo = &waE2E.ContextInfo{}
		}
		msg.ExtendedTextMessage.ContextInfo.MentionedJID = mentions
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send message: %w", err)
	}

	return resp.ID, nil
}

// SendImage sends an image message
func (m *Manager) SendImage(ctx context.Context, instanceID uuid.UUID, to string, imageData []byte, mimeType, caption string, quotedID string) (string, error) {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return "", fmt.Errorf("client not found")
	}

	jid, err := types.ParseJID(to)
	if err != nil {
		return "", fmt.Errorf("invalid JID: %w", err)
	}

	// Upload image
	uploaded, err := client.WAClient.Upload(ctx, imageData, whatsmeow.MediaImage)
	if err != nil {
		return "", fmt.Errorf("failed to upload image: %w", err)
	}

	msg := &waE2E.Message{
		ImageMessage: &waE2E.ImageMessage{
			Caption:       proto.String(caption),
			Mimetype:      proto.String(mimeType),
			URL:           proto.String(uploaded.URL),
			DirectPath:    proto.String(uploaded.DirectPath),
			MediaKey:      uploaded.MediaKey,
			FileEncSHA256: uploaded.FileEncSHA256,
			FileSHA256:    uploaded.FileSHA256,
			FileLength:    proto.Uint64(uint64(len(imageData))),
		},
	}

	if quotedID != "" {
		msg.ImageMessage.ContextInfo = &waE2E.ContextInfo{
			StanzaID:    proto.String(quotedID),
			Participant: proto.String(jid.String()),
		}
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send image: %w", err)
	}

	return resp.ID, nil
}

// SendVideo sends a video message
func (m *Manager) SendVideo(ctx context.Context, instanceID uuid.UUID, to string, videoData []byte, mimeType, caption string, quotedID string) (string, error) {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return "", fmt.Errorf("client not found")
	}

	jid, err := types.ParseJID(to)
	if err != nil {
		return "", fmt.Errorf("invalid JID: %w", err)
	}

	// Upload video
	uploaded, err := client.WAClient.Upload(ctx, videoData, whatsmeow.MediaVideo)
	if err != nil {
		return "", fmt.Errorf("failed to upload video: %w", err)
	}

	msg := &waE2E.Message{
		VideoMessage: &waE2E.VideoMessage{
			Caption:       proto.String(caption),
			Mimetype:      proto.String(mimeType),
			URL:           proto.String(uploaded.URL),
			DirectPath:    proto.String(uploaded.DirectPath),
			MediaKey:      uploaded.MediaKey,
			FileEncSHA256: uploaded.FileEncSHA256,
			FileSHA256:    uploaded.FileSHA256,
			FileLength:    proto.Uint64(uint64(len(videoData))),
		},
	}

	if quotedID != "" {
		msg.VideoMessage.ContextInfo = &waE2E.ContextInfo{
			StanzaID:    proto.String(quotedID),
			Participant: proto.String(jid.String()),
		}
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send video: %w", err)
	}

	return resp.ID, nil
}

// SendAudio sends an audio message
func (m *Manager) SendAudio(ctx context.Context, instanceID uuid.UUID, to string, audioData []byte, mimeType string, ptt bool, quotedID string) (string, error) {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return "", fmt.Errorf("client not found")
	}

	jid, err := types.ParseJID(to)
	if err != nil {
		return "", fmt.Errorf("invalid JID: %w", err)
	}

	// Upload audio
	uploaded, err := client.WAClient.Upload(ctx, audioData, whatsmeow.MediaAudio)
	if err != nil {
		return "", fmt.Errorf("failed to upload audio: %w", err)
	}

	msg := &waE2E.Message{
		AudioMessage: &waE2E.AudioMessage{
			Mimetype:      proto.String(mimeType),
			URL:           proto.String(uploaded.URL),
			DirectPath:    proto.String(uploaded.DirectPath),
			MediaKey:      uploaded.MediaKey,
			FileEncSHA256: uploaded.FileEncSHA256,
			FileSHA256:    uploaded.FileSHA256,
			FileLength:    proto.Uint64(uint64(len(audioData))),
			PTT:           proto.Bool(ptt),
		},
	}

	if quotedID != "" {
		msg.AudioMessage.ContextInfo = &waE2E.ContextInfo{
			StanzaID:    proto.String(quotedID),
			Participant: proto.String(jid.String()),
		}
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send audio: %w", err)
	}

	return resp.ID, nil
}

// SendDocument sends a document message
func (m *Manager) SendDocument(ctx context.Context, instanceID uuid.UUID, to string, docData []byte, mimeType, fileName, caption string, quotedID string) (string, error) {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return "", fmt.Errorf("client not found")
	}

	jid, err := types.ParseJID(to)
	if err != nil {
		return "", fmt.Errorf("invalid JID: %w", err)
	}

	// Upload document
	uploaded, err := client.WAClient.Upload(ctx, docData, whatsmeow.MediaDocument)
	if err != nil {
		return "", fmt.Errorf("failed to upload document: %w", err)
	}

	msg := &waE2E.Message{
		DocumentMessage: &waE2E.DocumentMessage{
			Caption:       proto.String(caption),
			Mimetype:      proto.String(mimeType),
			FileName:      proto.String(fileName),
			URL:           proto.String(uploaded.URL),
			DirectPath:    proto.String(uploaded.DirectPath),
			MediaKey:      uploaded.MediaKey,
			FileEncSHA256: uploaded.FileEncSHA256,
			FileSHA256:    uploaded.FileSHA256,
			FileLength:    proto.Uint64(uint64(len(docData))),
		},
	}

	if quotedID != "" {
		msg.DocumentMessage.ContextInfo = &waE2E.ContextInfo{
			StanzaID:    proto.String(quotedID),
			Participant: proto.String(jid.String()),
		}
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send document: %w", err)
	}

	return resp.ID, nil
}

// SendSticker sends a sticker message
func (m *Manager) SendSticker(ctx context.Context, instanceID uuid.UUID, to string, stickerData []byte, mimeType string) (string, error) {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return "", fmt.Errorf("client not found")
	}

	jid, err := types.ParseJID(to)
	if err != nil {
		return "", fmt.Errorf("invalid JID: %w", err)
	}

	// Upload sticker
	uploaded, err := client.WAClient.Upload(ctx, stickerData, whatsmeow.MediaImage)
	if err != nil {
		return "", fmt.Errorf("failed to upload sticker: %w", err)
	}

	msg := &waE2E.Message{
		StickerMessage: &waE2E.StickerMessage{
			Mimetype:      proto.String(mimeType),
			URL:           proto.String(uploaded.URL),
			DirectPath:    proto.String(uploaded.DirectPath),
			MediaKey:      uploaded.MediaKey,
			FileEncSHA256: uploaded.FileEncSHA256,
			FileSHA256:    uploaded.FileSHA256,
			FileLength:    proto.Uint64(uint64(len(stickerData))),
		},
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send sticker: %w", err)
	}

	return resp.ID, nil
}

// SendLocation sends a location message
func (m *Manager) SendLocation(ctx context.Context, instanceID uuid.UUID, to string, lat, lng float64, name, address string) (string, error) {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return "", fmt.Errorf("client not found")
	}

	jid, err := types.ParseJID(to)
	if err != nil {
		return "", fmt.Errorf("invalid JID: %w", err)
	}

	msg := &waE2E.Message{
		LocationMessage: &waE2E.LocationMessage{
			DegreesLatitude:  proto.Float64(lat),
			DegreesLongitude: proto.Float64(lng),
			Name:             proto.String(name),
			Address:          proto.String(address),
		},
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send location: %w", err)
	}

	return resp.ID, nil
}

// SendContact sends a contact card
func (m *Manager) SendContact(ctx context.Context, instanceID uuid.UUID, to string, contacts []entity.VCard) (string, error) {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return "", fmt.Errorf("client not found")
	}

	jid, err := types.ParseJID(to)
	if err != nil {
		return "", fmt.Errorf("invalid JID: %w", err)
	}

	// Build vCard
	var vcards []string
	for _, c := range contacts {
		vcard := fmt.Sprintf(`BEGIN:VCARD
VERSION:3.0
FN:%s
N:%s
TEL;type=CELL;type=VOICE;waid=%s:+%s
END:VCARD`, c.FullName, c.FullName, c.Phone, c.Phone)
		vcards = append(vcards, vcard)
	}

	displayName := contacts[0].DisplayName
	if displayName == "" {
		displayName = contacts[0].FullName
	}

	msg := &waE2E.Message{
		ContactMessage: &waE2E.ContactMessage{
			DisplayName: proto.String(displayName),
			Vcard:       proto.String(strings.Join(vcards, "\n")),
		},
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send contact: %w", err)
	}

	return resp.ID, nil
}

// SendReaction sends a reaction to a message
func (m *Manager) SendReaction(ctx context.Context, instanceID uuid.UUID, to, messageID, emoji string) (string, error) {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return "", fmt.Errorf("client not found")
	}

	jid, err := types.ParseJID(to)
	if err != nil {
		return "", fmt.Errorf("invalid JID: %w", err)
	}

	msg := &waE2E.Message{
		ReactionMessage: &waE2E.ReactionMessage{
			Key: &waCommon.MessageKey{
				RemoteJID: proto.String(jid.String()),
				FromMe:    proto.Bool(false),
				ID:        proto.String(messageID),
			},
			Text:              proto.String(emoji),
			SenderTimestampMS: proto.Int64(time.Now().UnixMilli()),
		},
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send reaction: %w", err)
	}

	return resp.ID, nil
}

// SendPoll sends a poll message
func (m *Manager) SendPoll(ctx context.Context, instanceID uuid.UUID, to, question string, options []string, selectableCount int) (string, error) {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return "", fmt.Errorf("client not found")
	}

	jid, err := types.ParseJID(to)
	if err != nil {
		return "", fmt.Errorf("invalid JID: %w", err)
	}

	if selectableCount <= 0 {
		selectableCount = 1
	}

	// Build poll options
	pollOptions := make([]*waE2E.PollCreationMessage_Option, len(options))
	for i, opt := range options {
		pollOptions[i] = &waE2E.PollCreationMessage_Option{
			OptionName: proto.String(opt),
		}
	}

	msg := &waE2E.Message{
		PollCreationMessage: &waE2E.PollCreationMessage{
			Name:                   proto.String(question),
			Options:                pollOptions,
			SelectableOptionsCount: proto.Uint32(uint32(selectableCount)),
		},
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send poll: %w", err)
	}

	return resp.ID, nil
}

// SendButtons sends a buttons message using whatsmeow protobufs
func (m *Manager) SendButtons(ctx context.Context, instanceID uuid.UUID, to, text, footer string, buttons []ButtonData, header *HeaderData) (string, error) {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return "", fmt.Errorf("client not found")
	}

	jid, err := types.ParseJID(to)
	if err != nil {
		return "", fmt.Errorf("invalid JID: %w", err)
	}

	// Build buttons
	waButtons := make([]*waE2E.ButtonsMessage_Button, len(buttons))
	for i, btn := range buttons {
		waButtons[i] = &waE2E.ButtonsMessage_Button{
			ButtonID: proto.String(btn.ID),
			ButtonText: &waE2E.ButtonsMessage_Button_ButtonText{
				DisplayText: proto.String(btn.Text),
			},
			Type: waE2E.ButtonsMessage_Button_RESPONSE.Enum(),
		}
	}

	// Build message
	buttonsMsg := &waE2E.ButtonsMessage{
		ContentText: proto.String(text),
		FooterText:  proto.String(footer),
		Buttons:     waButtons,
		HeaderType:  waE2E.ButtonsMessage_EMPTY.Enum(),
	}

	// Handle header
	if header != nil {
		switch header.Type {
		case "text":
			buttonsMsg.HeaderType = waE2E.ButtonsMessage_TEXT.Enum()
			buttonsMsg.Header = &waE2E.ButtonsMessage_Text{
				Text: header.Text,
			}
		case "image":
			if header.MediaData != nil {
				uploaded, err := client.WAClient.Upload(ctx, header.MediaData, whatsmeow.MediaImage)
				if err != nil {
					return "", fmt.Errorf("failed to upload header image: %w", err)
				}
				buttonsMsg.HeaderType = waE2E.ButtonsMessage_IMAGE.Enum()
				buttonsMsg.Header = &waE2E.ButtonsMessage_ImageMessage{
					ImageMessage: &waE2E.ImageMessage{
						URL:           proto.String(uploaded.URL),
						DirectPath:    proto.String(uploaded.DirectPath),
						MediaKey:      uploaded.MediaKey,
						FileEncSHA256: uploaded.FileEncSHA256,
						FileSHA256:    uploaded.FileSHA256,
						FileLength:    proto.Uint64(uint64(len(header.MediaData))),
						Mimetype:      proto.String(header.MimeType),
					},
				}
			}
		case "video":
			if header.MediaData != nil {
				uploaded, err := client.WAClient.Upload(ctx, header.MediaData, whatsmeow.MediaVideo)
				if err != nil {
					return "", fmt.Errorf("failed to upload header video: %w", err)
				}
				buttonsMsg.HeaderType = waE2E.ButtonsMessage_VIDEO.Enum()
				buttonsMsg.Header = &waE2E.ButtonsMessage_VideoMessage{
					VideoMessage: &waE2E.VideoMessage{
						URL:           proto.String(uploaded.URL),
						DirectPath:    proto.String(uploaded.DirectPath),
						MediaKey:      uploaded.MediaKey,
						FileEncSHA256: uploaded.FileEncSHA256,
						FileSHA256:    uploaded.FileSHA256,
						FileLength:    proto.Uint64(uint64(len(header.MediaData))),
						Mimetype:      proto.String(header.MimeType),
					},
				}
			}
		case "document":
			if header.MediaData != nil {
				uploaded, err := client.WAClient.Upload(ctx, header.MediaData, whatsmeow.MediaDocument)
				if err != nil {
					return "", fmt.Errorf("failed to upload header document: %w", err)
				}
				buttonsMsg.HeaderType = waE2E.ButtonsMessage_DOCUMENT.Enum()
				buttonsMsg.Header = &waE2E.ButtonsMessage_DocumentMessage{
					DocumentMessage: &waE2E.DocumentMessage{
						URL:           proto.String(uploaded.URL),
						DirectPath:    proto.String(uploaded.DirectPath),
						MediaKey:      uploaded.MediaKey,
						FileEncSHA256: uploaded.FileEncSHA256,
						FileSHA256:    uploaded.FileSHA256,
						FileLength:    proto.Uint64(uint64(len(header.MediaData))),
						Mimetype:      proto.String(header.MimeType),
						FileName:      proto.String(header.FileName),
					},
				}
			}
		}
	}

	msg := &waE2E.Message{
		ButtonsMessage: buttonsMsg,
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send buttons message: %w", err)
	}

	return resp.ID, nil
}

// SendList sends a list message using whatsmeow protobufs
func (m *Manager) SendList(ctx context.Context, instanceID uuid.UUID, to, title, description, buttonText, footer string, sections []ListSectionData) (string, error) {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return "", fmt.Errorf("client not found")
	}

	jid, err := types.ParseJID(to)
	if err != nil {
		return "", fmt.Errorf("invalid JID: %w", err)
	}

	// Build sections
	waSections := make([]*waE2E.ListMessage_Section, len(sections))
	for i, section := range sections {
		rows := make([]*waE2E.ListMessage_Row, len(section.Rows))
		for j, row := range section.Rows {
			rows[j] = &waE2E.ListMessage_Row{
				RowID:       proto.String(row.ID),
				Title:       proto.String(row.Title),
				Description: proto.String(row.Description),
			}
		}
		waSections[i] = &waE2E.ListMessage_Section{
			Title: proto.String(section.Title),
			Rows:  rows,
		}
	}

	listMsg := &waE2E.ListMessage{
		Title:       proto.String(title),
		Description: proto.String(description),
		ButtonText:  proto.String(buttonText),
		FooterText:  proto.String(footer),
		ListType:    waE2E.ListMessage_SINGLE_SELECT.Enum(),
		Sections:    waSections,
	}

	msg := &waE2E.Message{
		ListMessage: listMsg,
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send list message: %w", err)
	}

	return resp.ID, nil
}

// ButtonData represents button data for SendButtons
type ButtonData struct {
	ID   string
	Text string
	Type string
}

// HeaderData represents header data for interactive messages
type HeaderData struct {
	Type      string
	Text      string
	MediaData []byte
	MimeType  string
	FileName  string
}

// ListSectionData represents a section in a list message
type ListSectionData struct {
	Title string
	Rows  []ListRowData
}

// ListRowData represents a row in a list section
type ListRowData struct {
	ID          string
	Title       string
	Description string
}

// Helper function to download media from URL
func downloadMedia(url string) ([]byte, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}

// Helper function to decode base64 media
func decodeBase64Media(data string) ([]byte, error) {
	// Remove data URL prefix if present
	if idx := strings.Index(data, ","); idx != -1 {
		data = data[idx+1:]
	}
	return base64.StdEncoding.DecodeString(data)
}
