package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jonadableite/turbozap-api/internal/application/dto"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
	"github.com/jonadableite/turbozap-api/internal/infrastructure/whatsapp"
	"github.com/jonadableite/turbozap-api/internal/interface/response"
	"github.com/jonadableite/turbozap-api/pkg/validator"
	"go.uber.org/zap"
)

// InstanceHandler handles instance-related requests
type InstanceHandler struct {
	instanceRepo repository.InstanceRepository
	waManager    *whatsapp.Manager
	logger       *zap.Logger
}

// NewInstanceHandler creates a new instance handler
func NewInstanceHandler(instanceRepo repository.InstanceRepository, waManager *whatsapp.Manager, logger *zap.Logger) *InstanceHandler {
	return &InstanceHandler{
		instanceRepo: instanceRepo,
		waManager:    waManager,
		logger:       logger,
	}
}

// Create creates a new instance
func (h *InstanceHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateInstanceRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	// Validate instance name
	if !validator.InstanceName(req.Name) {
		return response.BadRequest(c, "Invalid instance name. Use only alphanumeric, underscore, and hyphen characters")
	}

	// Check if instance already exists
	exists, err := h.instanceRepo.Exists(c.Context(), req.Name)
	if err != nil {
		h.logger.Error("Failed to check instance existence", zap.Error(err))
		return response.InternalServerError(c, "Failed to create instance")
	}
	if exists {
		return response.Conflict(c, "Instance with this name already exists")
	}

	// Create new instance
	instance := entity.NewInstance(req.Name)

	// Save to database
	if err := h.instanceRepo.Create(c.Context(), instance); err != nil {
		h.logger.Error("Failed to create instance", zap.Error(err))
		return response.InternalServerError(c, "Failed to create instance")
	}

	// Create WhatsApp client
	if _, err := h.waManager.CreateClient(instance); err != nil {
		h.logger.Error("Failed to create WhatsApp client", zap.Error(err))
		// Still return success, client can be created later
	}

	return response.Created(c, dto.ToCreateInstanceResponse(instance))
}

// List lists all instances
func (h *InstanceHandler) List(c *fiber.Ctx) error {
	instances, err := h.instanceRepo.GetAll(c.Context())
	if err != nil {
		h.logger.Error("Failed to list instances", zap.Error(err))
		return response.InternalServerError(c, "Failed to list instances")
	}

	return response.Success(c, dto.ToListInstancesResponse(instances))
}

// Get gets a specific instance
func (h *InstanceHandler) Get(c *fiber.Ctx) error {
	name := c.Params("name")
	if name == "" {
		return response.BadRequest(c, "Instance name is required")
	}

	instance, err := h.instanceRepo.GetByName(c.Context(), name)
	if err != nil {
		h.logger.Error("Failed to get instance", zap.Error(err))
		return response.InternalServerError(c, "Failed to get instance")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	return response.Success(c, dto.ToInstanceResponse(instance))
}

// GetStatus gets the connection status of an instance
func (h *InstanceHandler) GetStatus(c *fiber.Ctx) error {
	name := c.Params("name")
	if name == "" {
		return response.BadRequest(c, "Instance name is required")
	}

	instance, err := h.instanceRepo.GetByName(c.Context(), name)
	if err != nil {
		h.logger.Error("Failed to get instance", zap.Error(err))
		return response.InternalServerError(c, "Failed to get instance status")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	// Update status from WhatsApp manager
	if h.waManager.IsConnected(instance.ID) {
		phone, profileName, profilePic, _ := h.waManager.GetConnectionInfo(instance.ID)
		instance.SetConnected(phone, profileName, profilePic)
	}

	return response.Success(c, dto.ToInstanceStatusResponse(instance))
}

// GetQRCode gets the QR code for an instance
func (h *InstanceHandler) GetQRCode(c *fiber.Ctx) error {
	name := c.Params("name")
	if name == "" {
		return response.BadRequest(c, "Instance name is required")
	}

	instance, err := h.instanceRepo.GetByName(c.Context(), name)
	if err != nil {
		h.logger.Error("Failed to get instance", zap.Error(err))
		return response.InternalServerError(c, "Failed to get QR code")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	// Check if client exists, create if not
	client, exists := h.waManager.GetClient(instance.ID)
	if !exists {
		client, err = h.waManager.CreateClient(instance)
		if err != nil {
			h.logger.Error("Failed to create WhatsApp client", zap.Error(err))
			return response.InternalServerError(c, "Failed to create WhatsApp client")
		}
	}

	// Connect to get QR code
	if !client.WAClient.IsConnected() {
		if err := h.waManager.Connect(c.Context(), instance.ID); err != nil {
			h.logger.Error("Failed to connect", zap.Error(err))
			return response.InternalServerError(c, "Failed to connect to WhatsApp")
		}
	}

	// Check if already connected (no QR code needed)
	if h.waManager.IsConnected(instance.ID) {
		phone, profileName, profilePic, _ := h.waManager.GetConnectionInfo(instance.ID)
		return response.Success(c, dto.QRCodeResponse{
			Name:   instance.Name,
			Status: "connected",
		})
		_ = phone
		_ = profileName
		_ = profilePic
	}

	// Get QR code
	code, qrImage, err := h.waManager.GetQRCode(instance.ID)
	if err != nil {
		h.logger.Error("Failed to get QR code", zap.Error(err))
		return response.InternalServerError(c, "Failed to get QR code")
	}

	return response.Success(c, dto.QRCodeResponse{
		Name:   instance.Name,
		Status: "qrcode",
		QRCode: qrImage,
		Code:   code,
	})
}

// Connect connects an instance to WhatsApp
func (h *InstanceHandler) Connect(c *fiber.Ctx) error {
	name := c.Params("name")
	if name == "" {
		return response.BadRequest(c, "Instance name is required")
	}

	instance, err := h.instanceRepo.GetByName(c.Context(), name)
	if err != nil {
		h.logger.Error("Failed to get instance", zap.Error(err))
		return response.InternalServerError(c, "Failed to connect")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	// Create client if not exists
	if _, exists := h.waManager.GetClient(instance.ID); !exists {
		if _, err := h.waManager.CreateClient(instance); err != nil {
			h.logger.Error("Failed to create WhatsApp client", zap.Error(err))
			return response.InternalServerError(c, "Failed to create WhatsApp client")
		}
	}

	// Connect
	if err := h.waManager.Connect(c.Context(), instance.ID); err != nil {
		h.logger.Error("Failed to connect", zap.Error(err))
		return response.InternalServerError(c, "Failed to connect to WhatsApp")
	}

	return response.Success(c, fiber.Map{
		"name":    instance.Name,
		"status":  "connecting",
		"message": "Connecting to WhatsApp, check QR code endpoint",
	})
}

// Restart restarts an instance
func (h *InstanceHandler) Restart(c *fiber.Ctx) error {
	name := c.Params("name")
	if name == "" {
		return response.BadRequest(c, "Instance name is required")
	}

	instance, err := h.instanceRepo.GetByName(c.Context(), name)
	if err != nil {
		h.logger.Error("Failed to get instance", zap.Error(err))
		return response.InternalServerError(c, "Failed to restart instance")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	// Disconnect
	if err := h.waManager.Disconnect(instance.ID); err != nil {
		h.logger.Warn("Failed to disconnect", zap.Error(err))
	}

	// Reconnect
	if err := h.waManager.Connect(c.Context(), instance.ID); err != nil {
		h.logger.Error("Failed to reconnect", zap.Error(err))
		return response.InternalServerError(c, "Failed to reconnect")
	}

	return response.Success(c, fiber.Map{
		"name":    instance.Name,
		"status":  "restarting",
		"message": "Instance is restarting",
	})
}

// Logout logs out from WhatsApp
func (h *InstanceHandler) Logout(c *fiber.Ctx) error {
	name := c.Params("name")
	if name == "" {
		return response.BadRequest(c, "Instance name is required")
	}

	instance, err := h.instanceRepo.GetByName(c.Context(), name)
	if err != nil {
		h.logger.Error("Failed to get instance", zap.Error(err))
		return response.InternalServerError(c, "Failed to logout")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	// Logout
	if err := h.waManager.Logout(instance.ID); err != nil {
		h.logger.Warn("Failed to logout", zap.Error(err))
	}

	// Update status
	instance.SetDisconnected()
	if err := h.instanceRepo.Update(c.Context(), instance); err != nil {
		h.logger.Error("Failed to update instance", zap.Error(err))
	}

	return response.Success(c, fiber.Map{
		"name":    instance.Name,
		"status":  "disconnected",
		"message": "Logged out successfully",
	})
}

// Delete deletes an instance
func (h *InstanceHandler) Delete(c *fiber.Ctx) error {
	name := c.Params("name")
	if name == "" {
		return response.BadRequest(c, "Instance name is required")
	}

	instance, err := h.instanceRepo.GetByName(c.Context(), name)
	if err != nil {
		h.logger.Error("Failed to get instance", zap.Error(err))
		return response.InternalServerError(c, "Failed to delete instance")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	// Delete WhatsApp client
	if err := h.waManager.DeleteClient(instance.ID); err != nil {
		h.logger.Warn("Failed to delete WhatsApp client", zap.Error(err))
	}

	// Delete from database
	if err := h.instanceRepo.Delete(c.Context(), instance.ID); err != nil {
		h.logger.Error("Failed to delete instance", zap.Error(err))
		return response.InternalServerError(c, "Failed to delete instance")
	}

	return response.Success(c, fiber.Map{
		"name":    instance.Name,
		"message": "Instance deleted successfully",
	})
}

