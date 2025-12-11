package handler

import (
	"bufio"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
	"github.com/jonadableite/turbozap-api/internal/interface/response"
	"github.com/sirupsen/logrus"
	"github.com/valyala/fasthttp"
)

// SSEHandler handles Server-Sent Events connections
type SSEHandler struct {
	instanceRepo repository.InstanceRepository
	logger       *logrus.Logger
	hub          *SSEHub
}

// SSEClient represents a connected SSE client
type SSEClient struct {
	ID         string
	InstanceID uuid.UUID
	Events     chan *SSEEvent
	Done       chan struct{}
}

// SSEEvent represents an event to be sent via SSE
type SSEEvent struct {
	Event string      `json:"event"`
	Data  interface{} `json:"data"`
}

// SSEHub manages all SSE client connections
type SSEHub struct {
	clients    map[string]*SSEClient
	register   chan *SSEClient
	unregister chan *SSEClient
	broadcast  chan *SSEBroadcast
	mu         sync.RWMutex
	logger     *logrus.Logger
}

// SSEBroadcast represents a broadcast message to specific instance
type SSEBroadcast struct {
	InstanceID uuid.UUID
	Event      string
	Data       interface{}
}

// NewSSEHub creates a new SSE hub
func NewSSEHub(logger *logrus.Logger) *SSEHub {
	hub := &SSEHub{
		clients:    make(map[string]*SSEClient),
		register:   make(chan *SSEClient),
		unregister: make(chan *SSEClient),
		broadcast:  make(chan *SSEBroadcast, 256),
		logger:     logger,
	}
	go hub.run()
	return hub
}

// run processes hub events
func (h *SSEHub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.ID] = client
			h.mu.Unlock()
			h.logger.WithFields(logrus.Fields{
				"client_id":   client.ID,
				"instance_id": client.InstanceID,
			}).Debug("SSE client registered")

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.ID]; ok {
				delete(h.clients, client.ID)
				close(client.Events)
			}
			h.mu.Unlock()
			h.logger.WithFields(logrus.Fields{
				"client_id": client.ID,
			}).Debug("SSE client unregistered")

		case msg := <-h.broadcast:
			h.mu.RLock()
			for _, client := range h.clients {
				if client.InstanceID == msg.InstanceID || msg.InstanceID == uuid.Nil {
					select {
					case client.Events <- &SSEEvent{Event: msg.Event, Data: msg.Data}:
					default:
						// Client buffer full, skip
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Broadcast sends an event to all clients subscribed to an instance
func (h *SSEHub) Broadcast(instanceID uuid.UUID, event string, data interface{}) {
	h.broadcast <- &SSEBroadcast{
		InstanceID: instanceID,
		Event:      event,
		Data:       data,
	}
}

// BroadcastAll sends an event to all connected clients
func (h *SSEHub) BroadcastAll(event string, data interface{}) {
	h.Broadcast(uuid.Nil, event, data)
}

// GetClientCount returns the number of connected clients
func (h *SSEHub) GetClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// GetClientCountByInstance returns the number of connected clients for an instance
func (h *SSEHub) GetClientCountByInstance(instanceID uuid.UUID) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	count := 0
	for _, client := range h.clients {
		if client.InstanceID == instanceID {
			count++
		}
	}
	return count
}

// NewSSEHandler creates a new SSE handler
func NewSSEHandler(instanceRepo repository.InstanceRepository, logger *logrus.Logger, hub *SSEHub) *SSEHandler {
	return &SSEHandler{
		instanceRepo: instanceRepo,
		logger:       logger,
		hub:          hub,
	}
}

// GetHub returns the SSE hub for external dispatching
func (h *SSEHandler) GetHub() *SSEHub {
	return h.hub
}

// Stream handles SSE connections for real-time events
func (h *SSEHandler) Stream(c *fiber.Ctx) error {
	instanceName := c.Params("instance")
	if instanceName == "" {
		return response.BadRequest(c, "Instance name is required")
	}

	// Validate instance exists
	instance, err := h.instanceRepo.GetByName(c.Context(), instanceName)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get instance")
		return response.InternalServerError(c, "Failed to get instance")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	// Authorize access to this instance
	if err := AuthorizeInstanceAccess(c, instance); err != nil {
		return err
	}

	// Create client
	client := &SSEClient{
		ID:         uuid.New().String(),
		InstanceID: instance.ID,
		Events:     make(chan *SSEEvent, 64),
		Done:       make(chan struct{}),
	}

	// Register client
	h.hub.register <- client

	// Cleanup on disconnect
	defer func() {
		h.hub.unregister <- client
		close(client.Done)
	}()

	h.logger.WithFields(logrus.Fields{
		"client_id": client.ID,
		"instance":  instanceName,
	}).Info("SSE client connected")

	// Set SSE headers
	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")
	c.Set("Transfer-Encoding", "chunked")
	c.Set("Access-Control-Allow-Origin", "*")
	c.Set("X-Accel-Buffering", "no")

	// Stream events
	c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
		// Send initial connection event
		h.writeSSEEvent(w, "connected", map[string]interface{}{
			"instance":   instanceName,
			"client_id":  client.ID,
			"message":    "Connected to SSE stream",
			"timestamp":  time.Now().Unix(),
		})

		ticker := time.NewTicker(30 * time.Second) // Heartbeat every 30 seconds
		defer ticker.Stop()

		for {
			select {
			case event, ok := <-client.Events:
				if !ok {
					return
				}
				h.writeSSEEvent(w, event.Event, event.Data)

			case <-ticker.C:
				// Send heartbeat to keep connection alive
				h.writeSSEEvent(w, "heartbeat", map[string]interface{}{
					"timestamp": time.Now().Unix(),
				})

			case <-client.Done:
				return
			}
		}
	})

	return nil
}

// StreamAll handles SSE connections for all instances (global stream)
func (h *SSEHandler) StreamAll(c *fiber.Ctx) error {
	// Create client for all instances
	client := &SSEClient{
		ID:         uuid.New().String(),
		InstanceID: uuid.Nil, // Nil means all instances
		Events:     make(chan *SSEEvent, 64),
		Done:       make(chan struct{}),
	}

	// Register client
	h.hub.register <- client

	// Cleanup on disconnect
	defer func() {
		h.hub.unregister <- client
		close(client.Done)
	}()

	h.logger.WithFields(logrus.Fields{
		"client_id": client.ID,
	}).Info("SSE client connected to global stream")

	// Set SSE headers
	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")
	c.Set("Transfer-Encoding", "chunked")
	c.Set("Access-Control-Allow-Origin", "*")
	c.Set("X-Accel-Buffering", "no")

	// Stream events
	c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
		// Send initial connection event
		h.writeSSEEvent(w, "connected", map[string]interface{}{
			"client_id": client.ID,
			"message":   "Connected to global SSE stream",
			"timestamp": time.Now().Unix(),
		})

		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case event, ok := <-client.Events:
				if !ok {
					return
				}
				h.writeSSEEvent(w, event.Event, event.Data)

			case <-ticker.C:
				h.writeSSEEvent(w, "heartbeat", map[string]interface{}{
					"timestamp": time.Now().Unix(),
				})

			case <-client.Done:
				return
			}
		}
	})

	return nil
}

// Info returns SSE connection information
func (h *SSEHandler) Info(c *fiber.Ctx) error {
	instanceName := c.Params("instance")
	
	var clientCount int
	if instanceName != "" {
		instance, err := h.instanceRepo.GetByName(c.Context(), instanceName)
		if err != nil {
			return response.InternalServerError(c, "Failed to get instance")
		}
		if instance == nil {
			return response.NotFound(c, "Instance not found")
		}
		
		// Authorize access to this instance
		if err := AuthorizeInstanceAccess(c, instance); err != nil {
			return err
		}
		
		clientCount = h.hub.GetClientCountByInstance(instance.ID)
	} else {
		clientCount = h.hub.GetClientCount()
	}

	return response.Success(c, fiber.Map{
		"connected_clients": clientCount,
		"instance":          instanceName,
	})
}

// writeSSEEvent writes an SSE formatted event to the writer
func (h *SSEHandler) writeSSEEvent(w *bufio.Writer, event string, data interface{}) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		h.logger.WithError(err).Error("Failed to marshal SSE event data")
		return
	}

	fmt.Fprintf(w, "event: %s\n", event)
	fmt.Fprintf(w, "data: %s\n\n", jsonData)
	w.Flush()
}

// SSEDispatcher implements WebhookDispatcher interface for SSE
type SSEDispatcher struct {
	hub       *SSEHub
	instances map[uuid.UUID]string
	mu        sync.RWMutex
	logger    *logrus.Logger
}

// NewSSEDispatcher creates a new SSE dispatcher
func NewSSEDispatcher(hub *SSEHub, logger *logrus.Logger) *SSEDispatcher {
	return &SSEDispatcher{
		hub:       hub,
		instances: make(map[uuid.UUID]string),
		logger:    logger,
	}
}

// Dispatch sends an event via SSE
func (d *SSEDispatcher) Dispatch(instanceID uuid.UUID, event entity.WebhookEvent, data interface{}) {
	d.hub.Broadcast(instanceID, string(event), data)
	d.logger.WithFields(logrus.Fields{
		"event":       string(event),
		"instance_id": instanceID.String(),
	}).Debug("📡 Event dispatched via SSE")
}

// RegisterInstance registers an instance for SSE dispatching
func (d *SSEDispatcher) RegisterInstance(instanceID uuid.UUID, instanceName string) {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.instances[instanceID] = instanceName
}

// sendToSSE helper for Fiber context streaming
func sendToSSE(ctx *fasthttp.RequestCtx, event string, data interface{}) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}
	
	fmt.Fprintf(ctx, "event: %s\n", event)
	fmt.Fprintf(ctx, "data: %s\n\n", jsonData)
	ctx.Response.Header.Set("Content-Type", "text/event-stream")
	return nil
}
