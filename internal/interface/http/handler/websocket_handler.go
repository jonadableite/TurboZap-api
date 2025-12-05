package handler

import (
	"encoding/json"
	"sync"
	"time"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/pkg/config"
	"github.com/sirupsen/logrus"
)

// WebSocketHub manages WebSocket connections and broadcasting
type WebSocketHub struct {
	clients    map[*WebSocketClient]bool
	broadcast  chan *WebSocketMessage
	register   chan *WebSocketClient
	unregister chan *WebSocketClient
	logger     *logrus.Logger
	mu         sync.RWMutex
}

// WebSocketClient represents a connected WebSocket client
type WebSocketClient struct {
	ID         string
	InstanceID uuid.UUID
	Conn       *websocket.Conn
	Send       chan []byte
	Hub        *WebSocketHub
}

// WebSocketMessage represents a message to be sent via WebSocket
type WebSocketMessage struct {
	Event      string      `json:"event"`
	InstanceID uuid.UUID   `json:"instance_id"`
	Data       interface{} `json:"data"`
	Timestamp  time.Time   `json:"timestamp"`
}

// NewWebSocketHub creates a new WebSocket hub
func NewWebSocketHub(logger *logrus.Logger) *WebSocketHub {
	hub := &WebSocketHub{
		clients:    make(map[*WebSocketClient]bool),
		broadcast:  make(chan *WebSocketMessage, 256),
		register:   make(chan *WebSocketClient),
		unregister: make(chan *WebSocketClient),
		logger:     logger,
	}

	go hub.run()

	return hub
}

func (h *WebSocketHub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			h.logger.WithFields(logrus.Fields{
				"client_id":  client.ID,
				"instance_id": client.InstanceID.String(),
			}).Debug("🔌 WebSocket client connected")

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
			h.mu.Unlock()
			h.logger.WithFields(logrus.Fields{
				"client_id": client.ID,
			}).Debug("🔌 WebSocket client disconnected")

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				// Only send to clients subscribed to this instance or all clients if no instance specified
				if message.InstanceID == uuid.Nil || client.InstanceID == message.InstanceID || client.InstanceID == uuid.Nil {
					select {
					case client.Send <- h.encodeMessage(message):
					default:
						// Client buffer full, close connection
						h.mu.RUnlock()
						h.mu.Lock()
						delete(h.clients, client)
						close(client.Send)
						h.mu.Unlock()
						h.mu.RLock()
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *WebSocketHub) encodeMessage(msg *WebSocketMessage) []byte {
	data, err := json.Marshal(msg)
	if err != nil {
		h.logger.WithError(err).Error("Failed to marshal WebSocket message")
		return nil
	}
	return data
}

// Broadcast sends a message to all connected clients
func (h *WebSocketHub) Broadcast(event string, instanceID uuid.UUID, data interface{}) {
	h.broadcast <- &WebSocketMessage{
		Event:      event,
		InstanceID: instanceID,
		Data:       data,
		Timestamp:  time.Now(),
	}
}

// BroadcastToInstance sends a message to clients subscribed to a specific instance
func (h *WebSocketHub) BroadcastToInstance(instanceID uuid.UUID, event string, data interface{}) {
	h.Broadcast(event, instanceID, data)
}

// GetConnectedClients returns the number of connected clients
func (h *WebSocketHub) GetConnectedClients() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// GetClientsByInstance returns the number of clients connected to a specific instance
func (h *WebSocketHub) GetClientsByInstance(instanceID uuid.UUID) int {
	h.mu.RLock()
	defer h.mu.RUnlock()

	count := 0
	for client := range h.clients {
		if client.InstanceID == instanceID {
			count++
		}
	}
	return count
}

// WebSocketHandler handles WebSocket connections
type WebSocketHandler struct {
	hub    *WebSocketHub
	config *config.Config
	logger *logrus.Logger
}

// NewWebSocketHandler creates a new WebSocket handler
func NewWebSocketHandler(hub *WebSocketHub, cfg *config.Config, logger *logrus.Logger) *WebSocketHandler {
	return &WebSocketHandler{
		hub:    hub,
		config: cfg,
		logger: logger,
	}
}

// Upgrade returns the middleware for upgrading HTTP connections to WebSocket
func (h *WebSocketHandler) Upgrade() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Check if it's a WebSocket upgrade request
		if websocket.IsWebSocketUpgrade(c) {
			// Validate token from query or header
			token := c.Query("token")
			if token == "" {
				token = c.Get("Authorization")
				if len(token) > 7 && token[:7] == "Bearer " {
					token = token[7:]
				}
			}

			// Simple token validation (matches API key)
			if h.config.Server.APIKey != "" && token != h.config.Server.APIKey {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
					"error": "Invalid or missing authentication token",
				})
			}

			// Get optional instance ID
			instanceIDStr := c.Query("instance_id")
			var instanceID uuid.UUID
			if instanceIDStr != "" {
				var err error
				instanceID, err = uuid.Parse(instanceIDStr)
				if err != nil {
					return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
						"error": "Invalid instance ID",
					})
				}
			}

			c.Locals("instanceID", instanceID)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	}
}

// Handle handles WebSocket connections
func (h *WebSocketHandler) Handle() fiber.Handler {
	return websocket.New(func(c *websocket.Conn) {
		instanceID, _ := c.Locals("instanceID").(uuid.UUID)

		client := &WebSocketClient{
			ID:         uuid.New().String(),
			InstanceID: instanceID,
			Conn:       c,
			Send:       make(chan []byte, 256),
			Hub:        h.hub,
		}

		h.hub.register <- client

		// Send welcome message
		welcomeMsg := &WebSocketMessage{
			Event:     "connected",
			Data:      map[string]interface{}{"client_id": client.ID},
			Timestamp: time.Now(),
		}
		welcomeData, _ := json.Marshal(welcomeMsg)
		c.WriteMessage(websocket.TextMessage, welcomeData)

		// Start goroutines for reading and writing
		go h.writePump(client)
		h.readPump(client)
	})
}

func (h *WebSocketHandler) readPump(client *WebSocketClient) {
	defer func() {
		h.hub.unregister <- client
		client.Conn.Close()
	}()

	for {
		_, message, err := client.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				h.logger.WithError(err).WithFields(logrus.Fields{
					"client_id": client.ID,
				}).Warn("WebSocket read error")
			}
			break
		}

		// Handle incoming messages (e.g., ping, subscribe, unsubscribe)
		h.handleClientMessage(client, message)
	}
}

func (h *WebSocketHandler) writePump(client *WebSocketClient) {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		client.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-client.Send:
			if !ok {
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := client.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				h.logger.WithError(err).WithFields(logrus.Fields{
					"client_id": client.ID,
				}).Warn("WebSocket write error")
				return
			}

		case <-ticker.C:
			// Send ping to keep connection alive
			if err := client.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (h *WebSocketHandler) handleClientMessage(client *WebSocketClient, message []byte) {
	var msg struct {
		Action string          `json:"action"`
		Data   json.RawMessage `json:"data"`
	}

	if err := json.Unmarshal(message, &msg); err != nil {
		h.logger.WithError(err).WithFields(logrus.Fields{
			"client_id": client.ID,
		}).Warn("Failed to parse client message")
		return
	}

	switch msg.Action {
	case "ping":
		// Respond with pong
		pongMsg := &WebSocketMessage{
			Event:     "pong",
			Timestamp: time.Now(),
		}
		data, _ := json.Marshal(pongMsg)
		client.Send <- data

	case "subscribe":
		// Subscribe to a specific instance
		var subscribeData struct {
			InstanceID string `json:"instance_id"`
		}
		if err := json.Unmarshal(msg.Data, &subscribeData); err == nil {
			if instanceID, err := uuid.Parse(subscribeData.InstanceID); err == nil {
				client.InstanceID = instanceID
				h.logger.WithFields(logrus.Fields{
					"client_id":  client.ID,
					"instance_id": instanceID.String(),
				}).Debug("Client subscribed to instance")
			}
		}

	case "unsubscribe":
		// Unsubscribe from instance
		client.InstanceID = uuid.Nil
		h.logger.WithFields(logrus.Fields{
			"client_id": client.ID,
		}).Debug("Client unsubscribed from instance")

	case "ack":
		// Acknowledge receipt of event
		var ackData struct {
			EventID string `json:"event_id"`
		}
		if err := json.Unmarshal(msg.Data, &ackData); err == nil {
			h.logger.WithFields(logrus.Fields{
				"client_id": client.ID,
				"event_id":  ackData.EventID,
			}).Debug("Event acknowledged")
		}
	}
}

// WebSocket event types
const (
	WSEventIncomingMessage = "incoming_message"
	WSEventMessageStatus   = "message_status"
	WSEventButtonClick     = "button_click"
	WSEventListSelection   = "list_selection"
	WSEventConnectionUpdate = "connection_update"
	WSEventQRCodeUpdate    = "qrcode_update"
	WSEventPresenceUpdate  = "presence_update"
	WSEventGroupUpdate     = "group_update"
)

// WebSocketDispatcher implements webhook dispatcher interface for WebSocket
type WebSocketDispatcher struct {
	hub    *WebSocketHub
	logger *logrus.Logger
}

// NewWebSocketDispatcher creates a new WebSocket dispatcher
func NewWebSocketDispatcher(hub *WebSocketHub, logger *logrus.Logger) *WebSocketDispatcher {
	return &WebSocketDispatcher{
		hub:    hub,
		logger: logger,
	}
}

// Dispatch sends an event via WebSocket
func (d *WebSocketDispatcher) Dispatch(instanceID uuid.UUID, event entity.WebhookEvent, data interface{}) {
	wsEvent := string(event)
	d.hub.BroadcastToInstance(instanceID, wsEvent, data)

	d.logger.WithFields(logrus.Fields{
		"event":       wsEvent,
		"instance_id": instanceID.String(),
	}).Debug("📡 Event dispatched via WebSocket")
}

