package whatsapp

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jonadableite/turbozap-api/internal/application/dto"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
	"github.com/jonadableite/turbozap-api/pkg/config"
	"github.com/sirupsen/logrus"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waCommon"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/store"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	waLog "go.mau.fi/whatsmeow/util/log"
	"google.golang.org/protobuf/proto"
)

// Manager manages multiple WhatsApp client instances
type Manager struct {
	config       *config.Config
	logger       *logrus.Logger
	dispatcher   WebhookDispatcher
	instanceRepo repository.InstanceRepository
	messageRepo  repository.MessageRepository
	container    *sqlstore.Container
	clients      map[uuid.UUID]*Client
	mu           sync.RWMutex
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
func NewManager(cfg *config.Config, pool *pgxpool.Pool, logger *logrus.Logger, dispatcher WebhookDispatcher, instanceRepo repository.InstanceRepository, messageRepo repository.MessageRepository) *Manager {
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
			logger.WithError(err).Warn("WhatsApp store tables already exist - this is normal if schema was pre-created")
			// The whatsmeow library should still work with existing tables
			// We'll try to continue, but if there are issues, the tables may need cleanup
		} else {
			logger.WithError(err).Fatal("Failed to create SQL store")
		}
	}

	return &Manager{
		config:       cfg,
		logger:       logger,
		dispatcher:   dispatcher,
		instanceRepo: instanceRepo,
		messageRepo:  messageRepo,
		container:    container,
		clients:      make(map[uuid.UUID]*Client),
	}
}

// getDeviceByJID retrieves a device by its JID from the store container
func (m *Manager) getDeviceByJID(ctx context.Context, jid string) (*store.Device, error) {
	devices, err := m.container.GetAllDevices(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get all devices: %w", err)
	}

	for _, device := range devices {
		if device.ID != nil && device.ID.String() == jid {
			return device, nil
		}
	}

	return nil, nil // Device not found, but that's okay
}

// CreateClient creates a new WhatsApp client for an instance
func (m *Manager) CreateClient(instance *entity.Instance) (*Client, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Check if client already exists
	if client, exists := m.clients[instance.ID]; exists {
		return client, nil
	}

	// Validate container
	if m.container == nil {
		return nil, fmt.Errorf("database container is not initialized")
	}

	// Try to load existing device by JID if available for session persistence
	var device *store.Device
	if instance.DeviceJID != "" {
		ctx := context.Background()
		existingDevice, err := m.getDeviceByJID(ctx, instance.DeviceJID)
		if err != nil {
			m.logger.WithFields(logrus.Fields{
				"instance":   instance.Name,
				"device_jid": instance.DeviceJID,
			}).WithError(err).Warn("Failed to load device by JID, creating new device")
			device = m.container.NewDevice()
		} else if existingDevice != nil {
			device = existingDevice
			m.logger.WithFields(logrus.Fields{
				"instance":   instance.Name,
				"device_jid": instance.DeviceJID,
			}).Info("Restored device from saved JID for session persistence")
		} else {
			// JID saved but device not found (might have been deleted), create new
			m.logger.WithFields(logrus.Fields{
				"instance":   instance.Name,
				"device_jid": instance.DeviceJID,
			}).Warn("Device JID saved but device not found in store, creating new device")
			device = m.container.NewDevice()
			// Clear the invalid JID
			instance.DeviceJID = ""
		}
	} else {
		// No saved JID, create new device
		device = m.container.NewDevice()
	}

	// Create whatsmeow client
	waLogger := waLog.Stdout("Client-"+instance.Name, "INFO", true)
	waClient := whatsmeow.NewClient(device, waLogger)
	if waClient == nil {
		return nil, fmt.Errorf("failed to create whatsmeow client: NewClient returned nil")
	}

	// Create event handler
	handler := NewEventHandler(instance.ID, instance.Name, m.logger, m.dispatcher, m.messageRepo)
	handler.SetWAClient(waClient)

	client := &Client{
		Instance: instance,
		WAClient: waClient,
		Device:   device,
		Handler:  handler,
	}

	// Register instance in dispatcher
	if m.dispatcher != nil {
		m.dispatcher.RegisterInstance(instance.ID, instance.Name)
	}

	// Set event handler callbacks
	handler.SetQRCodeHandler(func(qrCode string) {
		client.mu.Lock()
		client.QRCode = qrCode
		client.QRCodeImage = qrCode
		client.Instance.SetQRCode(qrCode)
		client.mu.Unlock()

		m.persistInstanceState(client.Instance)
	})

	handler.SetConnectedHandler(func(phone, name, pic string) {
		client.mu.Lock()
		client.Connected = true
		client.QRCode = ""
		client.Instance.SetConnected(phone, name, pic)

		// Save device JID for session persistence
		if client.WAClient != nil && client.WAClient.Store.ID != nil {
			deviceJID := client.WAClient.Store.ID.String()
			client.Instance.SetDeviceJID(deviceJID)
			m.logger.WithFields(logrus.Fields{
				"instance":   client.Instance.Name,
				"device_jid": deviceJID,
			}).Info("Saved device JID for instance")
		}
		client.mu.Unlock()

		m.persistInstanceState(client.Instance)
	})

	handler.SetDisconnectHandler(func() {
		client.mu.Lock()
		client.Connected = false
		client.Instance.SetDisconnected()
		wasConnected := client.Instance.Status == entity.InstanceStatusConnected
		client.mu.Unlock()

		m.persistInstanceState(client.Instance)

		// Auto-reconnect if enabled, has valid session, and was previously connected
		if m.config.WhatsApp.AutoReconnect && wasConnected {
			go m.scheduleAutoReconnect(client.Instance.ID, client.Instance.Name)
		}
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

	// Check if already connected (without holding lock during connect)
	client.mu.RLock()
	if client.WAClient == nil {
		client.mu.RUnlock()
		return fmt.Errorf("WhatsApp client is not initialized")
	}
	isConnected := client.WAClient.IsConnected()
	hasSession := client.WAClient.Store.ID != nil
	client.mu.RUnlock()

	if isConnected {
		m.logger.WithFields(logrus.Fields{
			"instance": client.Instance.Name,
		}).Debug("Client already connected, skipping")
		return nil
	}

	m.logger.WithFields(logrus.Fields{
		"instance":   client.Instance.Name,
		"hasSession": hasSession,
	}).Info("Connecting WhatsApp client")

	client.Instance.SetConnecting()
	m.persistInstanceState(client.Instance)

	// If not logged in (no session), we need to get QR codes
	if !hasSession {
		// GetQRChannel MUST be called BEFORE Connect() to receive QR codes
		qrChan, err := client.WAClient.GetQRChannel(ctx)
		if err != nil {
			// If GetQRChannel fails (e.g., already called), just proceed with connect
			m.logger.WithFields(logrus.Fields{
				"instance": client.Instance.Name,
			}).WithError(err).Warn("Failed to get QR channel, proceeding with connect")
		} else {
			// Start goroutine to handle QR codes
			go m.handleQRChannel(client, qrChan)
			m.logger.WithFields(logrus.Fields{
				"instance": client.Instance.Name,
			}).Info("QR channel handler started")
		}
	}

	// Connect with error handling
	err := client.WAClient.Connect()
	if err != nil {
		m.logger.WithFields(logrus.Fields{
			"instance": client.Instance.Name,
		}).WithError(err).Error("Failed to connect WhatsApp client")
		client.Instance.SetDisconnected()
		m.persistInstanceState(client.Instance)
		return fmt.Errorf("failed to connect: %w", err)
	}

	// Give it a moment to establish connection
	time.Sleep(500 * time.Millisecond)

	// Verify connection was established
	client.mu.RLock()
	isNowConnected := client.WAClient.IsConnected()
	client.mu.RUnlock()

	if isNowConnected {
		m.logger.WithFields(logrus.Fields{
			"instance": client.Instance.Name,
		}).Info("WhatsApp client connected successfully")
	} else {
		m.logger.WithFields(logrus.Fields{
			"instance": client.Instance.Name,
		}).Warn("WhatsApp client Connect() returned no error but client is not connected")
	}

	return nil
}

// handleQRChannel handles QR code events from the channel
func (m *Manager) handleQRChannel(client *Client, qrChan <-chan whatsmeow.QRChannelItem) {
	for evt := range qrChan {
		switch evt.Event {
		case "code":
			m.logger.WithFields(logrus.Fields{
				"instance": client.Instance.Name,
			}).Info("QR code received from channel")
			// Generate QR code image
			generator := NewQRCodeGenerator()
			qrImage, err := generator.Generate(evt.Code, 256)
			if err != nil {
				m.logger.WithError(err).Error("Failed to generate QR code image")
				continue
			}
			// Update client with QR code
			client.mu.Lock()
			client.QRCode = evt.Code
			client.QRCodeImage = qrImage
			client.mu.Unlock()

			// Dispatch webhook
			m.dispatcher.Dispatch(client.Instance.ID, entity.WebhookEventQRCodeUpdated, dto.QRCodeUpdateData{
				QRCode: qrImage,
				Code:   evt.Code,
			})
		case "success":
			m.logger.WithFields(logrus.Fields{
				"instance": client.Instance.Name,
			}).Info("QR code pairing successful")
			client.mu.Lock()
			client.Connected = true
			client.QRCode = ""
			client.QRCodeImage = ""
			client.mu.Unlock()
		case "timeout":
			m.logger.WithFields(logrus.Fields{
				"instance": client.Instance.Name,
			}).Warn("QR code timeout")
			client.mu.Lock()
			client.QRCode = ""
			client.QRCodeImage = ""
			client.mu.Unlock()
		case "error":
			m.logger.WithFields(logrus.Fields{
				"instance": client.Instance.Name,
			}).WithError(evt.Error).Error("QR code error")
		}
	}
}

// Disconnect disconnects a client from WhatsApp
func (m *Manager) Disconnect(instanceID uuid.UUID) error {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return fmt.Errorf("client not found")
	}

	client.mu.Lock()
	defer client.mu.Unlock()

	if client.WAClient == nil {
		m.logger.WithFields(logrus.Fields{
			"instance": client.Instance.Name,
		}).Warn("Disconnect: WhatsApp client is nil, skipping disconnect")
		client.Connected = false
		client.Instance.SetDisconnected()
		return nil
	}

	// Check if already disconnected to avoid WebSocket errors
	if !client.WAClient.IsConnected() {
		m.logger.WithFields(logrus.Fields{
			"instance": client.Instance.Name,
		}).Debug("Disconnect: client already disconnected")
		client.Connected = false
		client.Instance.SetDisconnected()
		return nil
	}

	// Disconnect with error handling
	if err := func() error {
		defer func() {
			if r := recover(); r != nil {
				m.logger.WithFields(logrus.Fields{
					"instance": client.Instance.Name,
					"panic":    r,
				}).Warn("Disconnect: recovered from panic during disconnect")
			}
		}()
		client.WAClient.Disconnect()
		return nil
	}(); err != nil {
		m.logger.WithFields(logrus.Fields{
			"instance": client.Instance.Name,
		}).WithError(err).Warn("Disconnect: error during disconnect (non-fatal)")
	}

	client.Connected = false
	client.Instance.SetDisconnected()
	m.persistInstanceState(client.Instance)

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

	if client.WAClient == nil {
		m.logger.WithFields(logrus.Fields{
			"instance": client.Instance.Name,
		}).Warn("Logout: WhatsApp client is nil, skipping logout")
		client.Connected = false
		client.QRCode = ""
		client.Instance.SetDisconnected()
		return nil
	}

	ctx := context.Background()

	// Try logout with error handling
	if client.WAClient.IsConnected() || client.WAClient.Store.ID != nil {
		if err := func() error {
			defer func() {
				if r := recover(); r != nil {
					m.logger.WithFields(logrus.Fields{
						"instance": client.Instance.Name,
						"panic":    r,
					}).Warn("Logout: recovered from panic during logout")
				}
			}()
			return client.WAClient.Logout(ctx)
		}(); err != nil {
			m.logger.WithFields(logrus.Fields{
				"instance": client.Instance.Name,
			}).WithError(err).Warn("Logout failed (non-fatal)")
		}
	}

	// Disconnect with error handling
	if err := func() error {
		defer func() {
			if r := recover(); r != nil {
				m.logger.WithFields(logrus.Fields{
					"instance": client.Instance.Name,
					"panic":    r,
				}).Warn("Logout: recovered from panic during disconnect")
			}
		}()
		if client.WAClient.IsConnected() {
			client.WAClient.Disconnect()
		}
		return nil
	}(); err != nil {
		m.logger.WithFields(logrus.Fields{
			"instance": client.Instance.Name,
		}).WithError(err).Warn("Logout: error during disconnect (non-fatal)")
	}

	client.Connected = false
	client.QRCode = ""
	client.Instance.SetDisconnected()

	m.persistInstanceState(client.Instance)

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

	// Disconnect and cleanup with error handling
	if client.WAClient != nil {
		if err := func() error {
			defer func() {
				if r := recover(); r != nil {
				}
			}()
			if client.WAClient.IsConnected() {
				client.WAClient.Disconnect()
			}
			return nil
		}(); err != nil {
		}
	}

	// Delete device from store
	ctx := context.Background()
	if client.Device != nil {
		if err := client.Device.Delete(ctx); err != nil {
		}
	}

	delete(m.clients, instanceID)
	return nil
}

// DisconnectAll disconnects all clients gracefully
func (m *Manager) DisconnectAll() {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.logger.WithFields(logrus.Fields{
		"clientsCount": len(m.clients),
	}).Info("DisconnectAll: disconnecting all WhatsApp clients")

	for instanceID, client := range m.clients {
		if client.WAClient == nil {
			m.logger.WithFields(logrus.Fields{
				"instanceID": instanceID.String(),
			}).Debug("DisconnectAll: skipping nil client")
			continue
		}

		// Check if already disconnected to avoid WebSocket errors
		if !client.WAClient.IsConnected() {
			m.logger.Debug("DisconnectAll: client already disconnected")
			continue
		}

		// Disconnect with error handling
		if err := func() error {
			defer func() {
				if r := recover(); r != nil {
				}
			}()
			client.WAClient.Disconnect()
			return nil
		}(); err != nil {
		} else {
			m.logger.Debug("DisconnectAll: successfully disconnected client")
		}

		// Update client state
		client.mu.Lock()
		client.Connected = false
		client.Instance.SetDisconnected()
		client.mu.Unlock()
	}

	m.logger.Info("DisconnectAll: all clients disconnected")
}

// RestoreInstances restores all instances from the database and attempts to reconnect them
func (m *Manager) RestoreInstances(ctx context.Context) error {
	if m.instanceRepo == nil {
		return fmt.Errorf("instance repository not configured")
	}

	instances, err := m.instanceRepo.GetAll(ctx)
	if err != nil {
		return fmt.Errorf("failed to get instances: %w", err)
	}

	m.logger.WithFields(logrus.Fields{
		"count": len(instances),
	}).Info("Restoring instances from database")

	for _, instance := range instances {
		// Create client first
		_, err := m.CreateClient(instance)
		if err != nil {
			m.logger.WithFields(logrus.Fields{
				"instance": instance.Name,
				"error":    err.Error(),
			}).Error("Failed to create client during restore")
			continue
		}

		m.logger.WithFields(logrus.Fields{
			"instance": instance.Name,
			"status":   instance.Status,
		}).Info("Client created for instance")

		// Skip auto-reconnect if disabled
		if !m.config.WhatsApp.AutoReconnect {
			m.logger.WithFields(logrus.Fields{
				"instance": instance.Name,
			}).Debug("Auto-reconnect disabled, skipping")
			continue
		}

		// Try to reconnect if instance was previously connected
		// Note: This will work if the device already has a session saved
		// For new devices, they will need QR code scan
		go func(inst *entity.Instance) {
			// Initial delay to allow client initialization
			time.Sleep(2 * time.Second)

			client, exists := m.GetClient(inst.ID)
			if !exists || client == nil || client.WAClient == nil {
				m.logger.WithFields(logrus.Fields{
					"instance": inst.Name,
				}).Warn("Client not ready for reconnect after delay")
				return
			}

			// Check if device has a valid session (previously logged in)
			client.mu.RLock()
			hasSession := client.WAClient.Store.ID != nil
			isAlreadyConnected := client.WAClient.IsConnected()
			client.mu.RUnlock()

			if isAlreadyConnected {
				m.logger.WithFields(logrus.Fields{
					"instance": inst.Name,
				}).Info("Client already connected, skipping reconnect")
				return
			}

			if !hasSession {
				m.logger.WithFields(logrus.Fields{
					"instance": inst.Name,
				}).Info("No valid session found for instance, will need QR code scan")
				// Still try to connect to get QR code
			} else {
				m.logger.WithFields(logrus.Fields{
					"instance": inst.Name,
				}).Info("Valid session found, attempting to restore connection")
			}

			// Attempt to reconnect with retry logic
			maxRetries := 3
			retryDelay := 2 * time.Second

			for attempt := 1; attempt <= maxRetries; attempt++ {
				reconnectCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)

				m.logger.WithFields(logrus.Fields{
					"instance":   inst.Name,
					"attempt":    attempt,
					"maxRetries": maxRetries,
				}).Info("Attempting to restore connection for instance")

				err := m.Connect(reconnectCtx, inst.ID)
				cancel()

				if err != nil {
					m.logger.WithFields(logrus.Fields{
						"instance": inst.Name,
						"attempt":  attempt,
						"error":    err.Error(),
					}).Warn("Failed to connect instance, will retry")

					if attempt < maxRetries {
						time.Sleep(retryDelay)
						retryDelay *= 2 // Exponential backoff
						continue
					} else {
						m.logger.WithFields(logrus.Fields{
							"instance":   inst.Name,
							"maxRetries": maxRetries,
						}).Error("Failed to restore connection after all retries")
						return
					}
				}

				// Verify connection was established
				time.Sleep(1 * time.Second) // Give it a moment to establish connection
				client.mu.RLock()
				isConnected := client.WAClient.IsConnected()
				hasSessionAfterConnect := client.WAClient.Store.ID != nil
				client.mu.RUnlock()

				if isConnected {
					m.logger.WithFields(logrus.Fields{
						"instance":   inst.Name,
						"hasSession": hasSessionAfterConnect,
					}).Info("Successfully restored connection for instance")
					return
				} else if hasSessionAfterConnect {
					// Has session but not connected - might be in process of connecting
					m.logger.WithFields(logrus.Fields{
						"instance": inst.Name,
					}).Info("Connection in progress, session exists")
					return
				} else {
					// No session - will need QR code
					m.logger.WithFields(logrus.Fields{
						"instance": inst.Name,
					}).Info("No session found, QR code will be required")
					return
				}
			}
		}(instance)
	}

	return nil
}

// scheduleAutoReconnect schedules an automatic reconnection attempt after a delay
func (m *Manager) scheduleAutoReconnect(instanceID uuid.UUID, instanceName string) {
	reconnectDelay := time.Duration(m.config.WhatsApp.ReconnectInterval) * time.Second
	m.logger.WithFields(logrus.Fields{
		"instance": instanceName,
		"delay":    reconnectDelay.String(),
	}).Info("Scheduling auto-reconnect")
	time.Sleep(reconnectDelay)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	client, exists := m.GetClient(instanceID)
	if !exists {
		m.logger.Warn("Client not found for auto-reconnect")
		return
	}

	// Check if already connected
	client.mu.RLock()
	isConnected := client.WAClient != nil && client.WAClient.IsConnected()
	hasSession := client.WAClient != nil && client.WAClient.Store.ID != nil
	client.mu.RUnlock()

	if isConnected {
		m.logger.Info("Instance already connected, skipping auto-reconnect")
		return
	}

	if !hasSession {
		m.logger.Info("No valid session found, skipping auto-reconnect")
		return
	}

	// Attempt to reconnect
	if err := m.Connect(ctx, instanceID); err != nil {
		// Schedule another attempt if enabled
		if m.config.WhatsApp.AutoReconnect {
			go m.scheduleAutoReconnect(instanceID, instanceName)
		}
		return
	}

	m.logger.Info("Auto-reconnect successful")
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

// IsConnected checks if a client is connected to the WebSocket
func (m *Manager) IsConnected(instanceID uuid.UUID) bool {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return false
	}

	client.mu.RLock()
	defer client.mu.RUnlock()

	if client.WAClient == nil {
		return false
	}
	return client.WAClient.IsConnected()
}

// IsLoggedIn checks if a client is authenticated/paired (has a valid session)
func (m *Manager) IsLoggedIn(instanceID uuid.UUID) bool {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return false
	}

	client.mu.RLock()
	defer client.mu.RUnlock()

	// Store.ID is set when the device is successfully paired
	if client.WAClient == nil {
		return false
	}
	return client.WAClient.Store.ID != nil
}

func (m *Manager) persistInstanceState(instance *entity.Instance) {
	if m.instanceRepo == nil || instance == nil {
		return
	}

	instanceCopy := *instance
	go func(data entity.Instance) {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := m.instanceRepo.Update(ctx, &data); err != nil {
		}
	}(instanceCopy)
}

// GetConnectionInfo returns connection information
func (m *Manager) GetConnectionInfo(instanceID uuid.UUID) (phone, name, pic string, err error) {
	client, exists := m.GetClient(instanceID)
	if !exists {
		return "", "", "", fmt.Errorf("client not found")
	}

	client.mu.RLock()
	defer client.mu.RUnlock()

	if client.WAClient == nil {
		return "", "", "", fmt.Errorf("WhatsApp client is not initialized")
	}
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

	if client.WAClient == nil {
		return "", fmt.Errorf("WhatsApp client is not initialized")
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send message: %w", err)
	}

	m.emitMessageSent(instanceID, jid, "text", resp.ID, text, "", "")

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

	if client.WAClient == nil {
		return "", fmt.Errorf("WhatsApp client is not initialized")
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send image: %w", err)
	}

	m.emitMessageSent(instanceID, jid, "image", resp.ID, "", caption, "")

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

	if client.WAClient == nil {
		return "", fmt.Errorf("WhatsApp client is not initialized")
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send video: %w", err)
	}

	m.emitMessageSent(instanceID, jid, "video", resp.ID, "", caption, "")

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

	if client.WAClient == nil {
		return "", fmt.Errorf("WhatsApp client is not initialized")
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send audio: %w", err)
	}

	m.emitMessageSent(instanceID, jid, "audio", resp.ID, "", "", "")

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

	if client.WAClient == nil {
		return "", fmt.Errorf("WhatsApp client is not initialized")
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send document: %w", err)
	}

	m.emitMessageSent(instanceID, jid, "document", resp.ID, "", caption, fileName)

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

	if client.WAClient == nil {
		return "", fmt.Errorf("WhatsApp client is not initialized")
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send sticker: %w", err)
	}

	m.emitMessageSent(instanceID, jid, "sticker", resp.ID, "", "", "")

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

	if client.WAClient == nil {
		return "", fmt.Errorf("WhatsApp client is not initialized")
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send location: %w", err)
	}

	m.emitMessageSent(instanceID, jid, "location", resp.ID, name, "", "")

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

	if client.WAClient == nil {
		return "", fmt.Errorf("WhatsApp client is not initialized")
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send contact: %w", err)
	}

	m.emitMessageSent(instanceID, jid, "contact", resp.ID, displayName, "", "")

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

	if client.WAClient == nil {
		return "", fmt.Errorf("WhatsApp client is not initialized")
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send reaction: %w", err)
	}

	m.emitMessageSent(instanceID, jid, "reaction", resp.ID, emoji, "", "")

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

	if client.WAClient == nil {
		return "", fmt.Errorf("WhatsApp client is not initialized")
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)
	if err != nil {
		return "", fmt.Errorf("failed to send poll: %w", err)
	}

	m.emitMessageSent(instanceID, jid, "poll", resp.ID, question, "", "")

	return resp.ID, nil
}

// buildCloudAPIInteractiveJSON constrói o JSON completo no formato Cloud API
// Formato: {"type":"button","body":{"text":"..."},"action":{"buttons":[...]},"footer":{"text":"..."}}
func buildCloudAPIInteractiveJSON(text, footer string, buttons []ButtonData) string {
	interactive := map[string]interface{}{
		"type": "button",
		"body": map[string]string{
			"text": text,
		},
		"action": map[string]interface{}{
			"buttons": make([]map[string]interface{}, len(buttons)),
		},
	}

	// Adicionar botões no formato Cloud API
	cloudButtons := make([]map[string]interface{}, len(buttons))
	for i, btn := range buttons {
		btnID := btn.ID
		if btnID == "" {
			btnID = fmt.Sprintf("btn_%d", i+1)
		}

		var buttonAction map[string]interface{}
		switch strings.ToLower(btn.Type) {
		case "url", "link":
			buttonAction = map[string]interface{}{
				"type": "url",
				"url": map[string]string{
					"id":    btnID,
					"title": btn.Text,
					"url":   btn.URL,
				},
			}
		case "phone", "call":
			buttonAction = map[string]interface{}{
				"type": "phone_number",
				"phone_number": map[string]string{
					"id":           btnID,
					"title":        btn.Text,
					"phone_number": btn.Phone,
				},
			}
		case "reply", "response", "":
			fallthrough
		default:
			buttonAction = map[string]interface{}{
				"type": "reply",
				"reply": map[string]string{
					"id":    btnID,
					"title": btn.Text,
				},
			}
		}
		cloudButtons[i] = buttonAction
	}
	interactive["action"].(map[string]interface{})["buttons"] = cloudButtons

	// Adicionar footer se houver
	if footer != "" {
		interactive["footer"] = map[string]string{
			"text": footer,
		}
	}

	jsonBytes, _ := json.Marshal(interactive)
	return string(jsonBytes)
}

// SendButtons sends a buttons message using InteractiveMessage with NativeFlowMessage
//
// ⚠️ IMPORTANTE: Tentativa de emular Cloud API - não há garantia de renderização
// O WhatsApp Web Multidevice não garante renderização de interativos
// A mensagem pode ser enviada com sucesso, mas os botões podem não renderizar
// Isso é uma limitação conhecida do protocolo, não da implementação.
//
// Alternativas recomendadas:
// - Use Poll (enquete) que funciona 100%: POST /message/:instance/poll
// - Use mensagens de texto com opções numeradas
// - Use ListMessage que tem melhor suporte
//
// Reference: https://github.com/tulir/whatsmeow/issues (Button messages are not supported)
// Reference: https://docs.uazapi.com/endpoint/post/send~menu (Termos: recursos podem ser descontinuados)
func (m *Manager) SendButtons(ctx context.Context, instanceID uuid.UUID, to, text, footer string, buttons []ButtonData, header *HeaderData) (string, error) {
	m.logger.Warn("SendButtons: ⚠️ AVISO - Botões interativos têm suporte limitado no WhatsApp Web API")
	m.logger.WithFields(logrus.Fields{
		"instanceID":   instanceID.String(),
		"to":           to,
		"buttonsCount": len(buttons),
	}).Info("SendButtons: iniciando envio de mensagem com botões")
	// Validações
	if text == "" {
		m.logger.Error("SendButtons: texto da mensagem é obrigatório")
		return "", fmt.Errorf("content text is required")
	}

	if len(buttons) == 0 {
		m.logger.Error("SendButtons: pelo menos um botão é necessário")
		return "", fmt.Errorf("at least one button is required")
	}

	if len(buttons) > 3 {
		m.logger.Warn("SendButtons: WhatsApp suporta no máximo 3 botões, truncando lista")
		buttons = buttons[:3]
	}

	client, exists := m.GetClient(instanceID)
	if !exists {
		m.logger.WithFields(logrus.Fields{
			"instanceID": instanceID.String(),
		}).Error("SendButtons: cliente não encontrado")
		return "", fmt.Errorf("client not found for instance %s", instanceID.String())
	}

	if client.WAClient == nil {
		m.logger.Error("SendButtons: cliente WhatsApp não inicializado")
		return "", fmt.Errorf("WhatsApp client is not initialized")
	}

	jid, err := types.ParseJID(to)
	if err != nil {
		return "", fmt.Errorf("invalid JID '%s': %w", to, err)
	}

	m.logger.Debug("SendButtons: construindo botões")
	// ============================================================
	// ABORDAGEM 1: ButtonsMessage com formato Cloud API dentro de NativeFlowInfo
	// Baseado na recomendação: construir JSON no formato Cloud API e colocar em ButtonParamsJSON
	// ============================================================
	waButtons := make([]*waE2E.ButtonsMessage_Button, len(buttons))
	for i, btn := range buttons {
		if btn.ID == "" {
			btn.ID = fmt.Sprintf("btn_%d", i+1)
		}

		// Construir JSON no formato Cloud API (estilo interactive → action → buttons)
		// Formato: {"type":"reply","reply":{"id":"...","title":"..."}}
		var buttonAction map[string]interface{}
		switch strings.ToLower(btn.Type) {
		case "url", "link":
			buttonAction = map[string]interface{}{
				"type": "url",
				"url": map[string]string{
					"id":    btn.ID,
					"title": btn.Text,
					"url":   btn.URL,
				},
			}
		case "phone", "call":
			buttonAction = map[string]interface{}{
				"type": "phone_number",
				"phone_number": map[string]string{
					"id":           btn.ID,
					"title":        btn.Text,
					"phone_number": btn.Phone,
				},
			}
		case "reply", "response", "":
			fallthrough
		default:
			// Focar em reply buttons primeiro (mais propensos a funcionar)
			buttonAction = map[string]interface{}{
				"type": "reply",
				"reply": map[string]string{
					"id":    btn.ID,
					"title": btn.Text,
				},
			}
		}

		// Serializar o JSON do botão
		buttonActionBytes, err := json.Marshal(buttonAction)
		if err != nil {
			return "", fmt.Errorf("failed to serialize button action: %w", err)
		}

		// Usar NATIVE_FLOW com NativeFlowInfo contendo o JSON no formato Cloud API
		waButton := &waE2E.ButtonsMessage_Button{
			ButtonID: proto.String(btn.ID),
			ButtonText: &waE2E.ButtonsMessage_Button_ButtonText{
				DisplayText: proto.String(btn.Text),
			},
			Type: waE2E.ButtonsMessage_Button_NATIVE_FLOW.Enum(),
			NativeFlowInfo: &waE2E.ButtonsMessage_Button_NativeFlowInfo{
				Name:       proto.String("quick_reply"), // Para reply buttons
				ParamsJSON: proto.String(string(buttonActionBytes)),
			},
		}

		// Ajustar nome conforme o tipo
		if btn.Type == "url" || btn.Type == "link" {
			waButton.NativeFlowInfo.Name = proto.String("cta_url")
		} else if btn.Type == "phone" || btn.Type == "call" {
			waButton.NativeFlowInfo.Name = proto.String("cta_call")
		}

		waButtons[i] = waButton

		m.logger.WithFields(logrus.Fields{
			"index":          i,
			"id":             btn.ID,
			"text":           btn.Text,
			"type":           btn.Type,
			"nativeFlowName": waButton.NativeFlowInfo.GetName(),
			"paramsJSON":     string(buttonActionBytes),
		}).Info("SendButtons: botão construído com formato Cloud API")
	}

	buttonsMsg := &waE2E.ButtonsMessage{
		ContentText: proto.String(text),
		Buttons:     waButtons,
		HeaderType:  waE2E.ButtonsMessage_EMPTY.Enum(),
	}
	if footer != "" {
		buttonsMsg.FooterText = proto.String(footer)
	}

	// ============================================================
	// ABORDAGEM 2: InteractiveMessage com NativeFlowMessage (fallback)
	// Usando formato Cloud API dentro do ButtonParamsJSON
	// ============================================================
	nativeButtons := make([]*waE2E.InteractiveMessage_NativeFlowMessage_NativeFlowButton, len(buttons))
	for i, btn := range buttons {
		if btn.ID == "" {
			btn.ID = fmt.Sprintf("btn_%d", i+1)
		}

		// Construir JSON no formato Cloud API (estilo interactive → action → buttons)
		var buttonAction map[string]interface{}
		switch strings.ToLower(btn.Type) {
		case "url", "link":
			buttonAction = map[string]interface{}{
				"type": "url",
				"url": map[string]string{
					"id":    btn.ID,
					"title": btn.Text,
					"url":   btn.URL,
				},
			}
		case "phone", "call":
			buttonAction = map[string]interface{}{
				"type": "phone_number",
				"phone_number": map[string]string{
					"id":           btn.ID,
					"title":        btn.Text,
					"phone_number": btn.Phone,
				},
			}
		case "reply", "response", "":
			fallthrough
		default:
			// Focar em reply buttons primeiro (mais propensos a funcionar)
			buttonAction = map[string]interface{}{
				"type": "reply",
				"reply": map[string]string{
					"id":    btn.ID,
					"title": btn.Text,
				},
			}
		}

		buttonActionBytes, _ := json.Marshal(buttonAction)

		// Determinar nome do NativeFlowButton
		nativeFlowName := "quick_reply"
		if btn.Type == "url" || btn.Type == "link" {
			nativeFlowName = "cta_url"
		} else if btn.Type == "phone" || btn.Type == "call" {
			nativeFlowName = "cta_call"
		}

		nativeButtons[i] = &waE2E.InteractiveMessage_NativeFlowMessage_NativeFlowButton{
			Name:             proto.String(nativeFlowName),
			ButtonParamsJSON: proto.String(string(buttonActionBytes)),
		}
	}

	// ============================================================
	// ABORDAGEM 2B: InteractiveMessage com ShopMessage para botões
	// Alternativa que pode funcionar melhor
	// ============================================================
	// Botões no formato cta_url ou cta_copy
	nativeButtonsAlt := make([]*waE2E.InteractiveMessage_NativeFlowMessage_NativeFlowButton, len(buttons))
	for i, btn := range buttons {
		if btn.ID == "" {
			btn.ID = fmt.Sprintf("btn_%d", i+1)
		}
		// Formato alternativo com estrutura mais completa
		buttonParams := map[string]interface{}{
			"display_text": btn.Text,
			"id":           btn.ID,
			"index":        i,
		}
		buttonParamsBytes, _ := json.Marshal(buttonParams)
		nativeButtonsAlt[i] = &waE2E.InteractiveMessage_NativeFlowMessage_NativeFlowButton{
			Name:             proto.String("quick_reply"),
			ButtonParamsJSON: proto.String(string(buttonParamsBytes)),
		}
	}

	interactiveMsg := &waE2E.InteractiveMessage{
		Header: &waE2E.InteractiveMessage_Header{
			Title:              proto.String(""),
			HasMediaAttachment: proto.Bool(false),
		},
		Body: &waE2E.InteractiveMessage_Body{
			Text: proto.String(text),
		},
		InteractiveMessage: &waE2E.InteractiveMessage_NativeFlowMessage_{
			NativeFlowMessage: &waE2E.InteractiveMessage_NativeFlowMessage{
				Buttons:           nativeButtons,
				MessageVersion:    proto.Int32(1),
				MessageParamsJSON: proto.String(buildCloudAPIInteractiveJSON(text, footer, buttons)),
			},
		},
	}
	if footer != "" {
		interactiveMsg.Footer = &waE2E.InteractiveMessage_Footer{
			Text: proto.String(footer),
		}
	}

	// Handle header if provided
	if header != nil {
		m.logger.Debug("SendButtons: processando header")

		switch header.Type {
		case "text":
			interactiveMsg.Header.Title = proto.String(header.Text)
			interactiveMsg.Header.HasMediaAttachment = proto.Bool(false)

		case "image":
			if header.MediaData != nil {
				uploaded, err := client.WAClient.Upload(ctx, header.MediaData, whatsmeow.MediaImage)
				if err != nil {
					m.logger.Error("SendButtons: falha no upload da imagem do header")
					return "", fmt.Errorf("failed to upload header image: %w", err)
				}
				interactiveMsg.Header.HasMediaAttachment = proto.Bool(true)
				interactiveMsg.Header.Media = &waE2E.InteractiveMessage_Header_ImageMessage{
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
					m.logger.Error("SendButtons: falha no upload do vídeo do header")
					return "", fmt.Errorf("failed to upload header video: %w", err)
				}
				interactiveMsg.Header.HasMediaAttachment = proto.Bool(true)
				interactiveMsg.Header.Media = &waE2E.InteractiveMessage_Header_VideoMessage{
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
					m.logger.Error("SendButtons: falha no upload do documento do header")
					return "", fmt.Errorf("failed to upload header document: %w", err)
				}
				interactiveMsg.Header.HasMediaAttachment = proto.Bool(true)
				interactiveMsg.Header.Media = &waE2E.InteractiveMessage_Header_DocumentMessage{
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

	// ============================================================
	// ESTRATÉGIA DE ENVIO EM CASCATA
	// Tenta diferentes formatos até encontrar um que funcione
	// ============================================================

	var resp whatsmeow.SendResponse
	var sendErr error
	var successMethod string

	// TENTATIVA 1: ButtonsMessage com NATIVE_FLOW + ViewOnceMessage
	m.logger.WithFields(logrus.Fields{
		"jid":          jid.String(),
		"buttonsCount": len(buttons),
	}).Info("SendButtons: tentativa 1 - ButtonsMessage NATIVE_FLOW + ViewOnceMessage")
	resp, sendErr = client.WAClient.SendMessage(ctx, jid, &waE2E.Message{
		ViewOnceMessage: &waE2E.FutureProofMessage{
			Message: &waE2E.Message{
				ButtonsMessage: buttonsMsg,
			},
		},
	})
	if sendErr == nil {
		successMethod = "ButtonsMessage NATIVE_FLOW + ViewOnceMessage"
	} else {
		m.logger.Warn("SendButtons: tentativa 1 falhou")

		// TENTATIVA 2: ButtonsMessage com NATIVE_FLOW sem envelope
		m.logger.Info("SendButtons: tentativa 2 - ButtonsMessage NATIVE_FLOW sem envelope")
		resp, sendErr = client.WAClient.SendMessage(ctx, jid, &waE2E.Message{
			ButtonsMessage: buttonsMsg,
		})
		if sendErr == nil {
			successMethod = "ButtonsMessage NATIVE_FLOW"
		} else {
			m.logger.Warn("SendButtons: tentativa 2 falhou")

			// TENTATIVA 3: ButtonsMessage com RESPONSE (formato tradicional)
			m.logger.Info("SendButtons: tentativa 3 - ButtonsMessage RESPONSE")
			// Reconstruir botões com tipo RESPONSE
			responseButtons := make([]*waE2E.ButtonsMessage_Button, len(buttons))
			for i, btn := range buttons {
				btnID := btn.ID
				if btnID == "" {
					btnID = fmt.Sprintf("btn_%d", i+1)
				}
				responseButtons[i] = &waE2E.ButtonsMessage_Button{
					ButtonID: proto.String(btnID),
					ButtonText: &waE2E.ButtonsMessage_Button_ButtonText{
						DisplayText: proto.String(btn.Text),
					},
					Type: waE2E.ButtonsMessage_Button_RESPONSE.Enum(),
				}
			}
			responseButtonsMsg := &waE2E.ButtonsMessage{
				ContentText: proto.String(text),
				Buttons:     responseButtons,
				HeaderType:  waE2E.ButtonsMessage_EMPTY.Enum(),
			}
			if footer != "" {
				responseButtonsMsg.FooterText = proto.String(footer)
			}

			resp, sendErr = client.WAClient.SendMessage(ctx, jid, &waE2E.Message{
				ViewOnceMessage: &waE2E.FutureProofMessage{
					Message: &waE2E.Message{
						ButtonsMessage: responseButtonsMsg,
					},
				},
			})
			if sendErr == nil {
				successMethod = "ButtonsMessage RESPONSE + ViewOnceMessage"
			} else {
				m.logger.Warn("SendButtons: tentativa 3 falhou")

				// TENTATIVA 4: InteractiveMessage com NativeFlowMessage
				m.logger.Info("SendButtons: tentativa 4 - InteractiveMessage NativeFlowMessage")
				resp, sendErr = client.WAClient.SendMessage(ctx, jid, &waE2E.Message{
					InteractiveMessage: interactiveMsg,
				})
				if sendErr == nil {
					successMethod = "InteractiveMessage NativeFlowMessage"
				} else {
					m.logger.Warn("SendButtons: tentativa 4 falhou")

					// TENTATIVA 5: InteractiveMessage com ViewOnceMessage
					m.logger.Info("SendButtons: tentativa 5 - InteractiveMessage + ViewOnceMessage")
					resp, sendErr = client.WAClient.SendMessage(ctx, jid, &waE2E.Message{
						ViewOnceMessage: &waE2E.FutureProofMessage{
							Message: &waE2E.Message{
								InteractiveMessage: interactiveMsg,
							},
						},
					})
					if sendErr == nil {
						successMethod = "InteractiveMessage + ViewOnceMessage"
					}
				}
			}
		}
	}

	if sendErr != nil {
		m.logger.Error("SendButtons: todas as tentativas falharam")
		return "", fmt.Errorf("failed to send buttons message to %s after 5 attempts: %w", jid.String(), sendErr)
	}

	m.logger.WithFields(logrus.Fields{
		"messageID":       resp.ID,
		"jid":             jid.String(),
		"method":          successMethod,
		"serverTimestamp": resp.Timestamp,
	}).Info("SendButtons: mensagem enviada com sucesso")
	m.emitMessageSent(instanceID, jid, "button", resp.ID, text, "", "")

	return resp.ID, nil
}

// SendList sends a list message using InteractiveMessage with NativeFlowMessage
// This is the format currently supported by WhatsApp (2024/2025)
// Reference: https://github.com/tulir/whatsmeow/discussions/711
// Reference: UAZAPI documentation https://www.postman.com/augustofcs/uazapi-v2/documentation
func (m *Manager) SendList(ctx context.Context, instanceID uuid.UUID, to, title, description, buttonText, footer string, sections []ListSectionData) (string, error) {
	m.logger.WithFields(logrus.Fields{
		"instanceID": instanceID.String(),
		"to":         to,
	}).Info("SendList: iniciando envio de mensagem de lista")
	// Validações
	if title == "" {
		m.logger.Error("SendList: título é obrigatório")
		return "", fmt.Errorf("list title is required")
	}

	if buttonText == "" {
		m.logger.Error("SendList: texto do botão é obrigatório")
		return "", fmt.Errorf("button text is required")
	}

	if len(sections) == 0 {
		m.logger.Error("SendList: pelo menos uma seção é necessária")
		return "", fmt.Errorf("at least one section is required")
	}

	// Validar total de rows (WhatsApp limita a 10 rows por seção tipicamente)
	totalRows := 0
	for _, section := range sections {
		if len(section.Rows) == 0 {
			m.logger.Warn("SendList: seção sem linhas será ignorada")
		}
		totalRows += len(section.Rows)
	}

	if totalRows == 0 {
		m.logger.Error("SendList: nenhuma linha encontrada nas seções")
		return "", fmt.Errorf("at least one row is required in sections")
	}

	client, exists := m.GetClient(instanceID)
	if !exists {
		m.logger.Error("SendList: cliente não encontrado")
		return "", fmt.Errorf("client not found for instance %s", instanceID.String())
	}

	if client.WAClient == nil {
		m.logger.Error("SendList: cliente WhatsApp não inicializado")
		return "", fmt.Errorf("WhatsApp client is not initialized")
	}

	jid, err := types.ParseJID(to)
	if err != nil {
		return "", fmt.Errorf("invalid JID '%s': %w", to, err)
	}

	m.logger.Debug("SendList: construindo seções para NativeFlowMessage")
	// Build sections in JSON format for NativeFlowMessage
	type listRow struct {
		ID          string `json:"id"`
		Title       string `json:"title"`
		Description string `json:"description,omitempty"`
	}
	type listSection struct {
		Title string    `json:"title"`
		Rows  []listRow `json:"rows"`
	}

	jsonSections := make([]listSection, 0, len(sections))
	for i, section := range sections {
		if len(section.Rows) == 0 {
			continue
		}

		rows := make([]listRow, len(section.Rows))
		for j, row := range section.Rows {
			rowID := row.ID
			if rowID == "" {
				rowID = fmt.Sprintf("row_%d_%d", i+1, j+1)
			}
			rows[j] = listRow{
				ID:          rowID,
				Title:       row.Title,
				Description: row.Description,
			}
		}

		jsonSections = append(jsonSections, listSection{
			Title: section.Title,
			Rows:  rows,
		})

		m.logger.Debug("SendList: seção construída")
	}

	// Build button params JSON for list
	// Formato esperado pelo WhatsApp para listas
	type listButtonParams struct {
		Title    string        `json:"title"`
		Sections []listSection `json:"sections"`
	}

	buttonParams := listButtonParams{
		Title:    buttonText,
		Sections: jsonSections,
	}

	buttonParamsBytes, err := json.Marshal(buttonParams)
	if err != nil {
		m.logger.Error("SendList: falha ao serializar parâmetros do botão")
		return "", fmt.Errorf("failed to serialize button params: %w", err)
	}

	// Build NativeFlowMessage with single_select list
	nativeButton := &waE2E.InteractiveMessage_NativeFlowMessage_NativeFlowButton{
		Name:             proto.String("single_select"),
		ButtonParamsJSON: proto.String(string(buttonParamsBytes)),
	}

	// Build InteractiveMessage
	// O campo NativeFlowMessage é um oneof, então precisa ser atribuído via wrapper
	interactiveMsg := &waE2E.InteractiveMessage{
		Header: &waE2E.InteractiveMessage_Header{
			Title:              proto.String(title),
			HasMediaAttachment: proto.Bool(false),
		},
		Body: &waE2E.InteractiveMessage_Body{
			Text: proto.String(description),
		},
		InteractiveMessage: &waE2E.InteractiveMessage_NativeFlowMessage_{
			NativeFlowMessage: &waE2E.InteractiveMessage_NativeFlowMessage{
				Buttons:        []*waE2E.InteractiveMessage_NativeFlowMessage_NativeFlowButton{nativeButton},
				MessageVersion: proto.Int32(1),
			},
		},
	}

	// Footer é opcional
	if footer != "" {
		interactiveMsg.Footer = &waE2E.InteractiveMessage_Footer{
			Text: proto.String(footer),
		}
	}

	// Construir também ListMessage tradicional para fallback
	waSections := make([]*waE2E.ListMessage_Section, 0, len(sections))
	for i, section := range sections {
		if len(section.Rows) == 0 {
			continue
		}
		rows := make([]*waE2E.ListMessage_Row, len(section.Rows))
		for j, row := range section.Rows {
			rowID := row.ID
			if rowID == "" {
				rowID = fmt.Sprintf("row_%d_%d", i+1, j+1)
			}
			rows[j] = &waE2E.ListMessage_Row{
				RowID:       proto.String(rowID),
				Title:       proto.String(row.Title),
				Description: proto.String(row.Description),
			}
		}
		waSections = append(waSections, &waE2E.ListMessage_Section{
			Title: proto.String(section.Title),
			Rows:  rows,
		})
	}

	listMsg := &waE2E.ListMessage{
		Title:      proto.String(title),
		ButtonText: proto.String(buttonText),
		ListType:   waE2E.ListMessage_SINGLE_SELECT.Enum(),
		Sections:   waSections,
	}
	if description != "" {
		listMsg.Description = proto.String(description)
	}
	if footer != "" {
		listMsg.FooterText = proto.String(footer)
	}

	// Tentar primeiro com ListMessage + ViewOnceMessage
	msg := &waE2E.Message{
		ViewOnceMessage: &waE2E.FutureProofMessage{
			Message: &waE2E.Message{
				ListMessage: listMsg,
			},
		},
	}

	resp, err := client.WAClient.SendMessage(ctx, jid, msg)

	// Se falhar com erro 405, tentar sem ViewOnceMessage
	if err != nil && strings.Contains(err.Error(), "405") {
		m.logger.Warn("SendList: erro 405 com ViewOnceMessage, tentando sem envelope")
		fallbackMsg := &waE2E.Message{
			ListMessage: listMsg,
		}

		resp, err = client.WAClient.SendMessage(ctx, jid, fallbackMsg)
		if err != nil {
			m.logger.Warn("SendList: erro também sem envelope, tentando InteractiveMessage")
			// Última tentativa: InteractiveMessage
			interactiveFallback := &waE2E.Message{
				InteractiveMessage: interactiveMsg,
			}

			resp, err = client.WAClient.SendMessage(ctx, jid, interactiveFallback)
			if err != nil {
				m.logger.Error("SendList: falha em todas as tentativas")
				return "", fmt.Errorf("failed to send list message to %s: %w", jid.String(), err)
			}
			m.logger.Info("SendList: sucesso com InteractiveMessage (último fallback)")
		} else {
			m.logger.Info("SendList: sucesso sem ViewOnceMessage")
		}
	} else if err != nil {
		m.logger.Error("SendList: falha ao enviar mensagem de lista")
		return "", fmt.Errorf("failed to send list message to %s: %w", jid.String(), err)
	}

	m.logger.WithFields(logrus.Fields{
		"messageID":       resp.ID,
		"jid":             jid.String(),
		"serverTimestamp": resp.Timestamp,
	}).Info("SendList: mensagem de lista enviada com sucesso")
	m.emitMessageSent(instanceID, jid, "list", resp.ID, title, "", "")

	return resp.ID, nil
}

func (m *Manager) emitMessageSent(instanceID uuid.UUID, to types.JID, messageType, messageID string, content, caption, fileName string) {
	if m.dispatcher == nil || messageID == "" {
		return
	}

	// Get instance to find sender JID
	var from string
	if client, ok := m.clients[instanceID]; ok && client.WAClient != nil && client.WAClient.Store.ID != nil {
		from = client.WAClient.Store.ID.User
	}

	m.dispatcher.Dispatch(instanceID, entity.WebhookEventSendMessage, dto.MessageSentEvent{
		MessageID: messageID,
		From:      from,
		To:        to.User, // Send only number, not full JID
		FromMe:    true,
		Type:      messageType,
		Content:   content,
		Caption:   caption,
		FileName:  fileName,
		Status:    "sent",
		Timestamp: time.Now(),
	})
}

// ButtonData represents button data for SendButtons
type ButtonData struct {
	ID    string // buttonId
	Text  string // displayText
	Type  string // reply, url, phone
	URL   string // For URL buttons
	Phone string // For phone buttons
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
