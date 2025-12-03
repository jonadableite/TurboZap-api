package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
	"github.com/jonadableite/turbozap-api/internal/infrastructure/whatsapp"
	"github.com/jonadableite/turbozap-api/internal/interface/response"
	"github.com/jonadableite/turbozap-api/pkg/validator"
	"go.mau.fi/whatsmeow/types"
	"go.uber.org/zap"
)

// PresenceHandler handles presence-related requests
type PresenceHandler struct {
	instanceRepo repository.InstanceRepository
	waManager    *whatsapp.Manager
	logger       *zap.Logger
}

// NewPresenceHandler creates a new presence handler
func NewPresenceHandler(instanceRepo repository.InstanceRepository, waManager *whatsapp.Manager, logger *zap.Logger) *PresenceHandler {
	return &PresenceHandler{
		instanceRepo: instanceRepo,
		waManager:    waManager,
		logger:       logger,
	}
}

func (h *PresenceHandler) getInstanceAndClient(c *fiber.Ctx) (*entity.Instance, *whatsapp.Client, error) {
	instanceName := c.Params("instance")
	if instanceName == "" {
		return nil, nil, response.BadRequest(c, "Instance name is required")
	}

	instance, err := h.instanceRepo.GetByName(c.Context(), instanceName)
	if err != nil {
		h.logger.Error("Failed to get instance", zap.Error(err))
		return nil, nil, response.InternalServerError(c, "Failed to get instance")
	}
	if instance == nil {
		return nil, nil, response.NotFound(c, "Instance not found")
	}

	client, exists := h.waManager.GetClient(instance.ID)
	if !exists || !client.WAClient.IsConnected() {
		return nil, nil, response.BadRequest(c, "Instance is not connected to WhatsApp")
	}

	return instance, client, nil
}

// SetAvailable sets presence to available (online)
func (h *PresenceHandler) SetAvailable(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndClient(c)
	if err != nil {
		return err
	}

	if err := client.WAClient.SendPresence(c.Context(), types.PresenceAvailable); err != nil {
		h.logger.Error("Failed to set presence", zap.Error(err))
		return response.InternalServerError(c, "Failed to set presence")
	}

	return response.Success(c, fiber.Map{
		"presence": "available",
		"message":  "Presence set to available",
	})
}

// SetUnavailable sets presence to unavailable (offline)
func (h *PresenceHandler) SetUnavailable(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndClient(c)
	if err != nil {
		return err
	}

	if err := client.WAClient.SendPresence(c.Context(), types.PresenceUnavailable); err != nil {
		h.logger.Error("Failed to set presence", zap.Error(err))
		return response.InternalServerError(c, "Failed to set presence")
	}

	return response.Success(c, fiber.Map{
		"presence": "unavailable",
		"message":  "Presence set to unavailable",
	})
}

// SetComposing sets presence to composing (typing) in a specific chat
func (h *PresenceHandler) SetComposing(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndClient(c)
	if err != nil {
		return err
	}

	// Get chat JID from body or params
	var req struct {
		To string `json:"to"`
	}
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	if req.To == "" {
		return response.BadRequest(c, "Chat JID is required")
	}

	jidStr, valid := validator.JID(req.To)
	if !valid {
		return response.BadRequest(c, "Invalid chat JID")
	}

	jid, err := types.ParseJID(jidStr)
	if err != nil {
		return response.BadRequest(c, "Invalid JID format")
	}

	if err := client.WAClient.SendChatPresence(c.Context(), jid, types.ChatPresenceComposing, types.ChatPresenceMediaText); err != nil {
		h.logger.Error("Failed to set composing presence", zap.Error(err))
		return response.InternalServerError(c, "Failed to set composing presence")
	}

	return response.Success(c, fiber.Map{
		"presence": "composing",
		"chat":     jidStr,
		"message":  "Composing presence set",
	})
}

// SetRecording sets presence to recording audio in a specific chat
func (h *PresenceHandler) SetRecording(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndClient(c)
	if err != nil {
		return err
	}

	var req struct {
		To string `json:"to"`
	}
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	if req.To == "" {
		return response.BadRequest(c, "Chat JID is required")
	}

	jidStr, valid := validator.JID(req.To)
	if !valid {
		return response.BadRequest(c, "Invalid chat JID")
	}

	jid, err := types.ParseJID(jidStr)
	if err != nil {
		return response.BadRequest(c, "Invalid JID format")
	}

	if err := client.WAClient.SendChatPresence(c.Context(), jid, types.ChatPresenceComposing, types.ChatPresenceMediaAudio); err != nil {
		h.logger.Error("Failed to set recording presence", zap.Error(err))
		return response.InternalServerError(c, "Failed to set recording presence")
	}

	return response.Success(c, fiber.Map{
		"presence": "recording",
		"chat":     jidStr,
		"message":  "Recording presence set",
	})
}

// ClearPresence clears chat presence (stop typing/recording)
func (h *PresenceHandler) ClearPresence(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndClient(c)
	if err != nil {
		return err
	}

	var req struct {
		To string `json:"to"`
	}
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	if req.To == "" {
		return response.BadRequest(c, "Chat JID is required")
	}

	jidStr, valid := validator.JID(req.To)
	if !valid {
		return response.BadRequest(c, "Invalid chat JID")
	}

	jid, err := types.ParseJID(jidStr)
	if err != nil {
		return response.BadRequest(c, "Invalid JID format")
	}

	if err := client.WAClient.SendChatPresence(c.Context(), jid, types.ChatPresencePaused, types.ChatPresenceMediaText); err != nil {
		h.logger.Error("Failed to clear presence", zap.Error(err))
		return response.InternalServerError(c, "Failed to clear presence")
	}

	return response.Success(c, fiber.Map{
		"presence": "paused",
		"chat":     jidStr,
		"message":  "Presence cleared",
	})
}

// SubscribePresence subscribes to presence updates for a contact
func (h *PresenceHandler) SubscribePresence(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndClient(c)
	if err != nil {
		return err
	}

	var req struct {
		JID string `json:"jid"`
	}
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	if req.JID == "" {
		return response.BadRequest(c, "JID is required")
	}

	jidStr, valid := validator.JID(req.JID)
	if !valid {
		return response.BadRequest(c, "Invalid JID")
	}

	jid, err := types.ParseJID(jidStr)
	if err != nil {
		return response.BadRequest(c, "Invalid JID format")
	}

	if err := client.WAClient.SubscribePresence(c.Context(), jid); err != nil {
		h.logger.Error("Failed to subscribe to presence", zap.Error(err))
		return response.InternalServerError(c, "Failed to subscribe to presence")
	}

	return response.Success(c, fiber.Map{
		"jid":     jidStr,
		"message": "Subscribed to presence updates",
	})
}
