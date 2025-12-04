package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jonadableite/turbozap-api/internal/application/dto"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
	"github.com/jonadableite/turbozap-api/internal/interface/response"
	"github.com/jonadableite/turbozap-api/pkg/validator"
	"go.uber.org/zap"
)

// WebhookHandler handles webhook-related requests
type WebhookHandler struct {
	instanceRepo repository.InstanceRepository
	webhookRepo  repository.WebhookRepository
	logger       *zap.Logger
}

// NewWebhookHandler creates a new webhook handler
func NewWebhookHandler(instanceRepo repository.InstanceRepository, webhookRepo repository.WebhookRepository, logger *zap.Logger) *WebhookHandler {
	return &WebhookHandler{
		instanceRepo: instanceRepo,
		webhookRepo:  webhookRepo,
		logger:       logger,
	}
}

// SetWebhook sets the webhook configuration for an instance
func (h *WebhookHandler) SetWebhook(c *fiber.Ctx) error {
	instanceName := c.Params("instance")
	if instanceName == "" {
		return response.BadRequest(c, "Instance name is required")
	}

	instance, err := h.instanceRepo.GetByName(c.Context(), instanceName)
	if err != nil {
		h.logger.Error("Failed to get instance", zap.Error(err))
		return response.InternalServerError(c, "Failed to get instance")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	var req dto.SetWebhookRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	// Validate URL
	if !validator.URL(req.URL) {
		return response.BadRequest(c, "Invalid webhook URL")
	}

	// Set default events if none specified
	events := req.Events
	if len(events) == 0 {
		events = entity.AllWebhookEvents()
	}

	// Set default enabled if not specified
	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}

	// Create or update webhook
	webhook := entity.NewWebhook(instance.ID, req.URL, events)
	webhook.Headers = req.Headers
	webhook.Enabled = enabled
	if req.ByEvents != nil {
		webhook.WebhookByEvents = *req.ByEvents
	}
	if req.Base64 != nil {
		webhook.UseBase64 = *req.Base64
	}

	if err := h.webhookRepo.Upsert(c.Context(), webhook); err != nil {
		h.logger.Error("Failed to save webhook", zap.Error(err))
		return response.InternalServerError(c, "Failed to save webhook configuration")
	}

	return response.Success(c, dto.ToGetWebhookResponse(webhook))
}

// GetWebhook gets the webhook configuration for an instance
func (h *WebhookHandler) GetWebhook(c *fiber.Ctx) error {
	instanceName := c.Params("instance")
	if instanceName == "" {
		return response.BadRequest(c, "Instance name is required")
	}

	instance, err := h.instanceRepo.GetByName(c.Context(), instanceName)
	if err != nil {
		h.logger.Error("Failed to get instance", zap.Error(err))
		return response.InternalServerError(c, "Failed to get instance")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	webhook, err := h.webhookRepo.GetByInstance(c.Context(), instance.ID)
	if err != nil {
		h.logger.Error("Failed to get webhook", zap.Error(err))
		return response.InternalServerError(c, "Failed to get webhook configuration")
	}

	if webhook == nil {
		return response.Success(c, fiber.Map{
			"configured": false,
			"message":    "No webhook configured for this instance",
		})
	}

	return response.Success(c, fiber.Map{
		"configured": true,
		"webhook":    dto.ToGetWebhookResponse(webhook),
	})
}

// DeleteWebhook deletes the webhook configuration for an instance
func (h *WebhookHandler) DeleteWebhook(c *fiber.Ctx) error {
	instanceName := c.Params("instance")
	if instanceName == "" {
		return response.BadRequest(c, "Instance name is required")
	}

	instance, err := h.instanceRepo.GetByName(c.Context(), instanceName)
	if err != nil {
		h.logger.Error("Failed to get instance", zap.Error(err))
		return response.InternalServerError(c, "Failed to get instance")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	if err := h.webhookRepo.DeleteByInstance(c.Context(), instance.ID); err != nil {
		h.logger.Error("Failed to delete webhook", zap.Error(err))
		return response.InternalServerError(c, "Failed to delete webhook configuration")
	}

	return response.Success(c, fiber.Map{
		"message": "Webhook configuration deleted",
	})
}

// EnableWebhook enables the webhook for an instance
func (h *WebhookHandler) EnableWebhook(c *fiber.Ctx) error {
	instanceName := c.Params("instance")
	if instanceName == "" {
		return response.BadRequest(c, "Instance name is required")
	}

	instance, err := h.instanceRepo.GetByName(c.Context(), instanceName)
	if err != nil {
		h.logger.Error("Failed to get instance", zap.Error(err))
		return response.InternalServerError(c, "Failed to get instance")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	webhook, err := h.webhookRepo.GetByInstance(c.Context(), instance.ID)
	if err != nil {
		h.logger.Error("Failed to get webhook", zap.Error(err))
		return response.InternalServerError(c, "Failed to get webhook")
	}

	if webhook == nil {
		return response.NotFound(c, "No webhook configured for this instance")
	}

	if err := h.webhookRepo.SetEnabled(c.Context(), webhook.ID, true); err != nil {
		h.logger.Error("Failed to enable webhook", zap.Error(err))
		return response.InternalServerError(c, "Failed to enable webhook")
	}

	return response.Success(c, fiber.Map{
		"enabled": true,
		"message": "Webhook enabled",
	})
}

// DisableWebhook disables the webhook for an instance
func (h *WebhookHandler) DisableWebhook(c *fiber.Ctx) error {
	instanceName := c.Params("instance")
	if instanceName == "" {
		return response.BadRequest(c, "Instance name is required")
	}

	instance, err := h.instanceRepo.GetByName(c.Context(), instanceName)
	if err != nil {
		h.logger.Error("Failed to get instance", zap.Error(err))
		return response.InternalServerError(c, "Failed to get instance")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	webhook, err := h.webhookRepo.GetByInstance(c.Context(), instance.ID)
	if err != nil {
		h.logger.Error("Failed to get webhook", zap.Error(err))
		return response.InternalServerError(c, "Failed to get webhook")
	}

	if webhook == nil {
		return response.NotFound(c, "No webhook configured for this instance")
	}

	if err := h.webhookRepo.SetEnabled(c.Context(), webhook.ID, false); err != nil {
		h.logger.Error("Failed to disable webhook", zap.Error(err))
		return response.InternalServerError(c, "Failed to disable webhook")
	}

	return response.Success(c, fiber.Map{
		"enabled": false,
		"message": "Webhook disabled",
	})
}

// ListWebhookEvents lists all available webhook events
func (h *WebhookHandler) ListWebhookEvents(c *fiber.Ctx) error {
	events := entity.AllWebhookEvents()
	eventStrings := make([]string, len(events))
	for i, e := range events {
		eventStrings[i] = string(e)
	}

	return response.Success(c, fiber.Map{
		"events": eventStrings,
	})
}
