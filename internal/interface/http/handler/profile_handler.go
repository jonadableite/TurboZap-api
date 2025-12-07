package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jonadableite/turbozap-api/internal/application/dto"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
	"github.com/jonadableite/turbozap-api/internal/infrastructure/whatsapp"
	"github.com/jonadableite/turbozap-api/internal/interface/response"
	"github.com/jonadableite/turbozap-api/pkg/validator"
	"github.com/sirupsen/logrus"
	"go.mau.fi/whatsmeow/types"
)

// ProfileHandler handles profile-related requests (privacy, status, calls)
type ProfileHandler struct {
	instanceRepo repository.InstanceRepository
	waManager    *whatsapp.Manager
	logger       *logrus.Logger
}

// NewProfileHandler creates a new profile handler
func NewProfileHandler(instanceRepo repository.InstanceRepository, waManager *whatsapp.Manager, logger *logrus.Logger) *ProfileHandler {
	return &ProfileHandler{
		instanceRepo: instanceRepo,
		waManager:    waManager,
		logger:       logger,
	}
}

// getInstanceAndClient retrieves and validates instance connection
func (h *ProfileHandler) getInstanceAndClient(c *fiber.Ctx) (*entity.Instance, *whatsapp.Client, error) {
	instanceName := c.Params("instance")
	if instanceName == "" {
		return nil, nil, response.BadRequest(c, "Instance name is required")
	}

	instance, err := h.instanceRepo.GetByName(c.Context(), instanceName)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get instance")
		return nil, nil, response.InternalServerError(c, "Failed to get instance")
	}
	if instance == nil {
		return nil, nil, response.NotFound(c, "Instance not found")
	}

	client, exists := h.waManager.GetClient(instance.ID)
	if !exists || client.WAClient == nil || !client.WAClient.IsConnected() {
		return nil, nil, response.BadRequest(c, "Instance is not connected to WhatsApp")
	}

	return instance, client, nil
}

// GetPrivacySettings gets the privacy settings of the WhatsApp account
func (h *ProfileHandler) GetPrivacySettings(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndClient(c)
	if err != nil {
		return err
	}

	settings := client.WAClient.GetPrivacySettings(c.Context())

	return response.Success(c, dto.PrivacySettingsResponse{
		GroupAdd:     string(settings.GroupAdd),
		LastSeen:     string(settings.LastSeen),
		Status:       string(settings.Status),
		Profile:      string(settings.Profile),
		ReadReceipts: string(settings.ReadReceipts),
		Online:       string(settings.Online),
		CallAdd:      string(settings.CallAdd),
	})
}

// SetPrivacySetting sets a specific privacy setting
func (h *ProfileHandler) SetPrivacySetting(c *fiber.Ctx) error {
	instance, client, err := h.getInstanceAndClient(c)
	if err != nil {
		return err
	}

	var req dto.SetPrivacySettingRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	if req.Setting == "" {
		return response.BadRequest(c, "Setting name is required")
	}
	if req.Value == "" {
		return response.BadRequest(c, "Setting value is required")
	}

	// Map setting string to type
	settingType, err := mapPrivacySettingType(req.Setting)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}

	// Map value string to privacy setting
	settingValue, err := mapPrivacySettingValue(req.Value)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}

	// Apply the privacy setting
	newSettings, err := client.WAClient.SetPrivacySetting(c.Context(), settingType, settingValue)
	if err != nil {
		h.logger.WithError(err).WithFields(logrus.Fields{
			"instance": instance.Name,
			"setting":  req.Setting,
			"value":    req.Value,
		}).Error("Failed to set privacy setting")
		return response.InternalServerError(c, "Failed to set privacy setting")
	}

	h.logger.WithFields(logrus.Fields{
		"instance": instance.Name,
		"setting":  req.Setting,
		"value":    req.Value,
	}).Info("Privacy setting updated")

	return response.Success(c, dto.SetPrivacySettingResponse{
		Setting: req.Setting,
		Value:   req.Value,
		Message: "Privacy setting updated successfully",
		Settings: dto.PrivacySettingsResponse{
			GroupAdd:     string(newSettings.GroupAdd),
			LastSeen:     string(newSettings.LastSeen),
			Status:       string(newSettings.Status),
			Profile:      string(newSettings.Profile),
			ReadReceipts: string(newSettings.ReadReceipts),
			Online:       string(newSettings.Online),
			CallAdd:      string(newSettings.CallAdd),
		},
	})
}

// SetProfileStatus sets the "about/recado" text in WhatsApp profile
func (h *ProfileHandler) SetProfileStatus(c *fiber.Ctx) error {
	instance, client, err := h.getInstanceAndClient(c)
	if err != nil {
		return err
	}

	var req dto.SetProfileStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	if req.Status == "" {
		return response.BadRequest(c, "Status text is required")
	}

	// Validate status length (WhatsApp limit is around 139 characters for about/status)
	if len(req.Status) > 500 {
		return response.BadRequest(c, "Status text is too long (max 500 characters)")
	}

	// Set the status message (about/recado)
	if err := client.WAClient.SetStatusMessage(c.Context(), req.Status); err != nil {
		h.logger.WithError(err).WithFields(logrus.Fields{
			"instance": instance.Name,
			"status":   req.Status,
		}).Error("Failed to set profile status")
		return response.InternalServerError(c, "Failed to set profile status")
	}

	h.logger.WithFields(logrus.Fields{
		"instance": instance.Name,
		"status":   req.Status,
	}).Info("Profile status updated")

	return response.Success(c, dto.SetProfileStatusResponse{
		Status:  req.Status,
		Message: "Profile status updated successfully",
	})
}

// RejectCall rejects an incoming voice/video call
func (h *ProfileHandler) RejectCall(c *fiber.Ctx) error {
	instance, client, err := h.getInstanceAndClient(c)
	if err != nil {
		return err
	}

	var req dto.RejectCallRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	if req.CallFrom == "" {
		return response.BadRequest(c, "Caller JID is required")
	}
	if req.CallID == "" {
		return response.BadRequest(c, "Call ID is required")
	}

	// Validate and format JID
	jidStr, valid := validator.JID(req.CallFrom)
	if !valid {
		return response.BadRequest(c, "Invalid caller JID")
	}

	jid, err := types.ParseJID(jidStr)
	if err != nil {
		return response.BadRequest(c, "Invalid JID format")
	}

	// Reject the call
	if err := client.WAClient.RejectCall(c.Context(), jid, req.CallID); err != nil {
		h.logger.WithError(err).WithFields(logrus.Fields{
			"instance":  instance.Name,
			"call_from": jidStr,
			"call_id":   req.CallID,
		}).Error("Failed to reject call")
		return response.InternalServerError(c, "Failed to reject call")
	}

	h.logger.WithFields(logrus.Fields{
		"instance":  instance.Name,
		"call_from": jidStr,
		"call_id":   req.CallID,
	}).Info("Call rejected successfully")

	return response.Success(c, dto.RejectCallResponse{
		CallFrom: jidStr,
		CallID:   req.CallID,
		Message:  "Call rejected successfully",
	})
}

// mapPrivacySettingType maps a string to whatsmeow privacy setting type
func mapPrivacySettingType(setting string) (types.PrivacySettingType, error) {
	switch setting {
	case "group_add":
		return types.PrivacySettingTypeGroupAdd, nil
	case "last_seen":
		return types.PrivacySettingTypeLastSeen, nil
	case "status":
		return types.PrivacySettingTypeStatus, nil
	case "profile":
		return types.PrivacySettingTypeProfile, nil
	case "read_receipts":
		return types.PrivacySettingTypeReadReceipts, nil
	case "online":
		return types.PrivacySettingTypeOnline, nil
	case "call_add":
		return types.PrivacySettingTypeCallAdd, nil
	default:
		return "", fiber.NewError(fiber.StatusBadRequest, "Invalid privacy setting type. Valid options: group_add, last_seen, status, profile, read_receipts, online, call_add")
	}
}

// mapPrivacySettingValue maps a string to whatsmeow privacy setting value
func mapPrivacySettingValue(value string) (types.PrivacySetting, error) {
	switch value {
	case "all":
		return types.PrivacySettingAll, nil
	case "contacts":
		return types.PrivacySettingContacts, nil
	case "contact_blacklist":
		return types.PrivacySettingContactBlacklist, nil
	case "none":
		return types.PrivacySettingNone, nil
	case "match_last_seen":
		return types.PrivacySettingMatchLastSeen, nil
	case "known":
		return types.PrivacySettingKnown, nil
	default:
		return "", fiber.NewError(fiber.StatusBadRequest, "Invalid privacy setting value. Valid options: all, contacts, contact_blacklist, none, match_last_seen, known")
	}
}
