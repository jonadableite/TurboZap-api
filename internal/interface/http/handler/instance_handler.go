package handler

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jonadableite/turbozap-api/internal/application/dto"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
	"github.com/jonadableite/turbozap-api/internal/infrastructure/whatsapp"
	"github.com/jonadableite/turbozap-api/internal/interface/response"
	"github.com/jonadableite/turbozap-api/pkg/validator"
	"github.com/sirupsen/logrus"
)

// InstanceHandler handles instance-related requests
type InstanceHandler struct {
	instanceRepo repository.InstanceRepository
	waManager    *whatsapp.Manager
	logger       *logrus.Logger
}

// NewInstanceHandler creates a new instance handler
func NewInstanceHandler(instanceRepo repository.InstanceRepository, waManager *whatsapp.Manager, logger *logrus.Logger) *InstanceHandler {
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
		h.logger.WithError(err).Error("Failed to check instance existence")
		return response.InternalServerError(c, "Failed to create instance")
	}
	if exists {
		return response.Conflict(c, "Instance with this name already exists")
	}

	// Create new instance
	instance := entity.NewInstance(req.Name)
	if userID, _ := c.Locals("userID").(string); userID != "" {
		instance.UserID = userID
	}

	// Save to database
	if err := h.instanceRepo.Create(c.Context(), instance); err != nil {
		h.logger.WithError(err).Error("Failed to create instance")
		return response.InternalServerError(c, "Failed to create instance")
	}

	// Create WhatsApp client
	if _, err := h.waManager.CreateClient(instance); err != nil {
		h.logger.WithError(err).Error("Failed to create WhatsApp client")
		// Still return success, client can be created later
	}

	return response.Created(c, dto.ToCreateInstanceResponse(instance))
}

// List lists all instances
func (h *InstanceHandler) List(c *fiber.Ctx) error {
	userID, _ := c.Locals("userID").(string)
	isGlobal := c.Locals("isGlobalAdmin") == true

	var (
		instances []*entity.Instance
		err       error
	)

	if userID != "" && !isGlobal {
		instances, err = h.instanceRepo.GetByUserID(c.Context(), userID)
	} else {
		instances, err = h.instanceRepo.GetAll(c.Context())
	}
	if err != nil {
		h.logger.WithError(err).Error("Failed to list instances")
		return response.InternalServerError(c, "Failed to list instances")
	}

	// Update status from WhatsApp Manager for each instance
	for _, instance := range instances {
		if h.waManager.IsLoggedIn(instance.ID) {
			phone, profileName, profilePic, _ := h.waManager.GetConnectionInfo(instance.ID)
			instance.SetConnected(phone, profileName, profilePic)
		} else if h.waManager.IsConnected(instance.ID) {
			// Connected to websocket but not logged in - pending QR scan
			instance.Status = "connecting"
		} else {
			instance.SetDisconnected()
		}
	}

	return response.Success(c, dto.ToListInstancesResponse(instances))
}

func (h *InstanceHandler) authorizeInstanceAccess(c *fiber.Ctx, instance *entity.Instance) error {
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	if c.Locals("isGlobalAdmin") == true {
		return nil
	}

	userID, _ := c.Locals("userID").(string)
	if userID == "" || instance.UserID == "" {
		return nil
	}

	if instance.UserID != userID {
		return response.Forbidden(c, "You don't have access to this instance")
	}

	return nil
}

// Get gets a specific instance
func (h *InstanceHandler) Get(c *fiber.Ctx) error {
	name := c.Params("name")
	if name == "" {
		return response.BadRequest(c, "Instance name is required")
	}

	instance, err := h.instanceRepo.GetByName(c.Context(), name)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get instance")
		return response.InternalServerError(c, "Failed to get instance")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	if err := h.authorizeInstanceAccess(c, instance); err != nil {
		return err
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
		h.logger.WithError(err).Error("Failed to get instance")
		return response.InternalServerError(c, "Failed to get instance status")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	if err := h.authorizeInstanceAccess(c, instance); err != nil {
		return err
	}

	// Update status from WhatsApp manager
	// Use IsLoggedIn to check if authenticated (not just WebSocket connected)
	if h.waManager.IsLoggedIn(instance.ID) {
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
		h.logger.WithError(err).Error("Failed to get instance")
		return response.InternalServerError(c, "Failed to get QR code")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	if err := h.authorizeInstanceAccess(c, instance); err != nil {
		return err
	}

	// Check if client exists, create if not
	_, exists := h.waManager.GetClient(instance.ID)
	if !exists {
		_, err = h.waManager.CreateClient(instance)
		if err != nil {
			h.logger.WithError(err).Error("Failed to create WhatsApp client")
			return response.InternalServerError(c, "Failed to create WhatsApp client")
		}
	}

	// Check if already logged in (authenticated/paired) - no QR code needed
	if h.waManager.IsLoggedIn(instance.ID) {
		phone, profileName, profilePic, _ := h.waManager.GetConnectionInfo(instance.ID)
		instance.SetConnected(phone, profileName, profilePic)
		return response.Success(c, dto.QRCodeResponse{
			Name:   instance.Name,
			Status: "connected",
		})
	}

	// Connect to get QR code (this will trigger QR code generation via GetQRChannel)
	if err := h.waManager.Connect(c.Context(), instance.ID); err != nil {
		h.logger.WithError(err).Error("Failed to connect")
		return response.InternalServerError(c, "Failed to connect to WhatsApp")
	}

	// Wait a short time for QR code to be generated (the QR channel is async)
	// The QR code is generated in a goroutine after Connect()
	time.Sleep(500 * time.Millisecond)

	// Get QR code
	code, qrImage, err := h.waManager.GetQRCode(instance.ID)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get QR code")
		return response.InternalServerError(c, "Failed to get QR code")
	}

	// If no QR code available yet, return a pending status
	if code == "" && qrImage == "" {
		return response.Success(c, dto.QRCodeResponse{
			Name:   instance.Name,
			Status: "pending",
		})
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
		h.logger.WithError(err).Error("Failed to get instance")
		return response.InternalServerError(c, "Failed to connect")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	if err := h.authorizeInstanceAccess(c, instance); err != nil {
		return err
	}

	// Create client if not exists
	if _, exists := h.waManager.GetClient(instance.ID); !exists {
		if _, err := h.waManager.CreateClient(instance); err != nil {
			h.logger.WithError(err).Error("Failed to create WhatsApp client")
			return response.InternalServerError(c, "Failed to create WhatsApp client")
		}
	}

	// Connect
	if err := h.waManager.Connect(c.Context(), instance.ID); err != nil {
		h.logger.WithError(err).Error("Failed to connect")
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
		h.logger.WithError(err).Error("Failed to get instance")
		return response.InternalServerError(c, "Failed to restart instance")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	if err := h.authorizeInstanceAccess(c, instance); err != nil {
		return err
	}

	// Disconnect
	if err := h.waManager.Disconnect(instance.ID); err != nil {
		h.logger.WithError(err).Warn("Failed to disconnect")
	}

	// Reconnect
	if err := h.waManager.Connect(c.Context(), instance.ID); err != nil {
		h.logger.WithError(err).Error("Failed to reconnect")
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
		h.logger.WithError(err).Error("Failed to get instance")
		return response.InternalServerError(c, "Failed to logout")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	if err := h.authorizeInstanceAccess(c, instance); err != nil {
		return err
	}

	// Logout
	if err := h.waManager.Logout(instance.ID); err != nil {
		h.logger.WithError(err).Warn("Failed to logout")
	}

	// Update status
	instance.SetDisconnected()
	if err := h.instanceRepo.Update(c.Context(), instance); err != nil {
		h.logger.WithError(err).Error("Failed to update instance")
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
		h.logger.WithError(err).Error("Failed to get instance")
		return response.InternalServerError(c, "Failed to delete instance")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	if err := h.authorizeInstanceAccess(c, instance); err != nil {
		return err
	}

	// Delete WhatsApp client
	if err := h.waManager.DeleteClient(instance.ID); err != nil {
		h.logger.WithError(err).Warn("Failed to delete WhatsApp client")
	}

	// Delete from database
	if err := h.instanceRepo.Delete(c.Context(), instance.ID); err != nil {
		h.logger.WithError(err).Error("Failed to delete instance")
		return response.InternalServerError(c, "Failed to delete instance")
	}

	return response.Success(c, fiber.Map{
		"name":    instance.Name,
		"message": "Instance deleted successfully",
	})
}

// UpdateName updates the name of an instance
func (h *InstanceHandler) UpdateName(c *fiber.Ctx) error {
	name := c.Params("name")
	if name == "" {
		return response.BadRequest(c, "Instance name is required")
	}

	var req dto.UpdateInstanceNameRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	// Validate new instance name
	if !validator.InstanceName(req.Name) {
		return response.BadRequest(c, "Invalid new instance name. Use only alphanumeric, underscore, and hyphen characters")
	}

	// Get the instance
	instance, err := h.instanceRepo.GetByName(c.Context(), name)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get instance")
		return response.InternalServerError(c, "Failed to update instance name")
	}
	if instance == nil {
		return response.NotFound(c, "Instance not found")
	}

	if err := h.authorizeInstanceAccess(c, instance); err != nil {
		return err
	}

	// Check if new name already exists (if different from current)
	if req.Name != instance.Name {
		exists, err := h.instanceRepo.Exists(c.Context(), req.Name)
		if err != nil {
			h.logger.WithError(err).Error("Failed to check instance existence")
			return response.InternalServerError(c, "Failed to update instance name")
		}
		if exists {
			return response.Conflict(c, "Instance with this name already exists")
		}
	}

	oldName := instance.Name
	instance.Name = req.Name

	// Update in database
	if err := h.instanceRepo.Update(c.Context(), instance); err != nil {
		h.logger.WithError(err).Error("Failed to update instance name")
		return response.InternalServerError(c, "Failed to update instance name")
	}

	h.logger.WithFields(logrus.Fields{
		"old_name": oldName,
		"new_name": req.Name,
	}).Info("Instance name updated")

	return response.Success(c, dto.UpdateInstanceNameResponse{
		OldName: oldName,
		NewName: req.Name,
		Message: "Instance name updated successfully",
	})
}
