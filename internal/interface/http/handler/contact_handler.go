package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
	"github.com/jonadableite/turbozap-api/internal/infrastructure/whatsapp"
	"github.com/jonadableite/turbozap-api/internal/interface/response"
	"github.com/jonadableite/turbozap-api/pkg/validator"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	"github.com/sirupsen/logrus"
)

// ContactHandler handles contact-related requests
type ContactHandler struct {
	instanceRepo repository.InstanceRepository
	waManager    *whatsapp.Manager
	logger       *logrus.Logger
}

// NewContactHandler creates a new contact handler
func NewContactHandler(instanceRepo repository.InstanceRepository, waManager *whatsapp.Manager, logger *logrus.Logger) *ContactHandler {
	return &ContactHandler{
		instanceRepo: instanceRepo,
		waManager:    waManager,
		logger:       logger,
	}
}

func (h *ContactHandler) getInstanceAndClient(c *fiber.Ctx) (*entity.Instance, *whatsapp.Client, error) {
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
	if !exists || !client.WAClient.IsConnected() {
		return nil, nil, response.BadRequest(c, "Instance is not connected to WhatsApp")
	}

	return instance, client, nil
}

// CheckNumbers checks if phone numbers are registered on WhatsApp
func (h *ContactHandler) CheckNumbers(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndClient(c)
	if err != nil {
		return err
	}

	var req entity.CheckNumberRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	if len(req.Numbers) == 0 {
		return response.BadRequest(c, "At least one number is required")
	}

	results := make([]entity.CheckNumberResponse, 0, len(req.Numbers))

	for _, number := range req.Numbers {
		cleanNumber, valid := validator.PhoneNumber(number)
		if !valid {
			results = append(results, entity.CheckNumberResponse{
				Number: number,
				Exists: false,
			})
			continue
		}

		// Check if number is on WhatsApp
		resp, err := client.WAClient.IsOnWhatsApp(c.Context(), []string{"+" + cleanNumber})
		if err != nil {
			h.logger.WithError(err).WithFields(logrus.Fields{
				"number": cleanNumber,
			}).Error("Failed to check number")
			results = append(results, entity.CheckNumberResponse{
				Number: number,
				Exists: false,
			})
			continue
		}

		if len(resp) > 0 && resp[0].IsIn {
			results = append(results, entity.CheckNumberResponse{
				Number:     number,
				JID:        resp[0].JID.String(),
				Exists:     true,
				IsBusiness: resp[0].VerifiedName != nil,
			})
		} else {
			results = append(results, entity.CheckNumberResponse{
				Number: number,
				Exists: false,
			})
		}
	}

	return response.Success(c, fiber.Map{
		"results": results,
	})
}

// GetProfilePicture gets the profile picture of a contact
func (h *ContactHandler) GetProfilePicture(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndClient(c)
	if err != nil {
		return err
	}

	jidParam := c.Params("jid")
	if jidParam == "" {
		jidParam = c.Query("jid")
	}

	if jidParam == "" {
		return response.BadRequest(c, "JID is required")
	}

	jidStr, valid := validator.JID(jidParam)
	if !valid {
		return response.BadRequest(c, "Invalid JID")
	}

	jid, err := types.ParseJID(jidStr)
	if err != nil {
		return response.BadRequest(c, "Invalid JID format")
	}

	picInfo, err := client.WAClient.GetProfilePictureInfo(c.Context(), jid, &whatsmeow.GetProfilePictureParams{})
	if err != nil {
		h.logger.WithError(err).Error("Failed to get profile picture")
		return response.Success(c, entity.ProfilePicResponse{
			JID:        jidStr,
			ProfilePic: "",
		})
	}

	picURL := ""
	if picInfo != nil {
		picURL = picInfo.URL
	}

	return response.Success(c, entity.ProfilePicResponse{
		JID:        jidStr,
		ProfilePic: picURL,
	})
}

// GetContactInfo gets information about a contact
func (h *ContactHandler) GetContactInfo(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndClient(c)
	if err != nil {
		return err
	}

	jidParam := c.Params("jid")
	if jidParam == "" {
		return response.BadRequest(c, "JID is required")
	}

	jidStr, valid := validator.JID(jidParam)
	if !valid {
		return response.BadRequest(c, "Invalid JID")
	}

	jid, err := types.ParseJID(jidStr)
	if err != nil {
		return response.BadRequest(c, "Invalid JID format")
	}

	// Get contact info from device store
	contact, err := client.WAClient.Store.Contacts.GetContact(c.Context(), jid)
	
	info := entity.ContactInfo{
		JID:         jidStr,
		PhoneNumber: jid.User,
	}

	if err == nil && contact.Found {
		info.Name = contact.FullName
		info.PushName = contact.PushName
		info.BusinessName = contact.BusinessName
	}

	// Get profile picture
	picInfo, err := client.WAClient.GetProfilePictureInfo(c.Context(), jid, &whatsmeow.GetProfilePictureParams{})
	if err == nil && picInfo != nil {
		info.ProfilePic = picInfo.URL
	}

	// Check if business
	resp, err := client.WAClient.IsOnWhatsApp(c.Context(), []string{"+" + jid.User})
	if err == nil && len(resp) > 0 {
		info.IsBusiness = resp[0].VerifiedName != nil
		if resp[0].VerifiedName != nil {
			info.BusinessName = resp[0].VerifiedName.Details.GetVerifiedName()
			info.IsVerified = resp[0].VerifiedName.Details != nil
		}
	}

	return response.Success(c, info)
}

// BlockContact blocks a contact
func (h *ContactHandler) BlockContact(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndClient(c)
	if err != nil {
		return err
	}

	var req entity.BlockContactRequest
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

	// Block contact
	_, err = client.WAClient.UpdateBlocklist(c.Context(), jid, events.BlocklistChangeActionBlock)
	if err != nil {
		h.logger.WithError(err).Error("Failed to block contact")
		return response.InternalServerError(c, "Failed to block contact")
	}

	return response.Success(c, fiber.Map{
		"jid":     jidStr,
		"blocked": true,
		"message": "Contact blocked successfully",
	})
}

// UnblockContact unblocks a contact
func (h *ContactHandler) UnblockContact(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndClient(c)
	if err != nil {
		return err
	}

	var req entity.BlockContactRequest
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

	// Unblock contact
	_, err = client.WAClient.UpdateBlocklist(c.Context(), jid, events.BlocklistChangeActionUnblock)
	if err != nil {
		h.logger.WithError(err).Error("Failed to unblock contact")
		return response.InternalServerError(c, "Failed to unblock contact")
	}

	return response.Success(c, fiber.Map{
		"jid":     jidStr,
		"blocked": false,
		"message": "Contact unblocked successfully",
	})
}

// ListContacts lists all contacts
func (h *ContactHandler) ListContacts(c *fiber.Ctx) error {
	_, client, err := h.getInstanceAndClient(c)
	if err != nil {
		return err
	}

	// Get all contacts from store
	contacts, err := client.WAClient.Store.Contacts.GetAllContacts(c.Context())
	if err != nil {
		h.logger.WithError(err).Error("Failed to get contacts")
		return response.InternalServerError(c, "Failed to get contacts")
	}

	result := make([]entity.ContactInfo, 0, len(contacts))
	for jid, contact := range contacts {
		info := entity.ContactInfo{
			JID:          jid.String(),
			PhoneNumber:  jid.User,
			Name:         contact.FullName,
			PushName:     contact.PushName,
			BusinessName: contact.BusinessName,
		}
		result = append(result, info)
	}

	return response.Success(c, fiber.Map{
		"contacts": result,
		"total":    len(result),
	})
}
