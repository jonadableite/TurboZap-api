package handler

import (
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jonadableite/turbozap-api/internal/application/dto"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
	"github.com/jonadableite/turbozap-api/internal/infrastructure/whatsapp"
	"github.com/jonadableite/turbozap-api/internal/interface/response"
	"github.com/jonadableite/turbozap-api/pkg/validator"
	"github.com/sirupsen/logrus"
)

// MessageHandler handles message-related requests
type MessageHandler struct {
	instanceRepo repository.InstanceRepository
	messageRepo  repository.MessageRepository
	waManager    *whatsapp.Manager
	logger       *logrus.Logger
}

// NewMessageHandler creates a new message handler
func NewMessageHandler(instanceRepo repository.InstanceRepository, messageRepo repository.MessageRepository, waManager *whatsapp.Manager, logger *logrus.Logger) *MessageHandler {
	return &MessageHandler{
		instanceRepo: instanceRepo,
		messageRepo:  messageRepo,
		waManager:    waManager,
		logger:       logger,
	}
}

// getInstanceAndValidate gets instance and validates connection
func (h *MessageHandler) getInstanceAndValidate(c *fiber.Ctx) (*entity.Instance, error) {
	instanceName := c.Params("instance")
	if instanceName == "" {
		return nil, response.BadRequest(c, "Instance name is required")
	}

	instance, err := h.instanceRepo.GetByName(c.Context(), instanceName)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get instance")
		return nil, response.InternalServerError(c, "Failed to get instance")
	}
	if instance == nil {
		return nil, response.NotFound(c, "Instance not found")
	}

	if err := AuthorizeInstanceAccess(c, instance); err != nil {
		return nil, err
	}

	// Check if connected
	if !h.waManager.IsConnected(instance.ID) {
		return nil, response.BadRequest(c, "Instance is not connected to WhatsApp")
	}

	return instance, nil
}

// formatJID formats a phone number to WhatsApp JID
func formatJID(to string) string {
	jid, valid := validator.JID(to)
	if !valid {
		return ""
	}
	return jid
}

// downloadMediaFromURL downloads media from a URL
func downloadMediaFromURL(url string) ([]byte, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

// decodeBase64 decodes base64 data
func decodeBase64(data string) ([]byte, error) {
	// Remove data URL prefix if present
	if idx := strings.Index(data, ","); idx != -1 {
		data = data[idx+1:]
	}
	return base64.StdEncoding.DecodeString(data)
}

// SendText sends a text message
func (h *MessageHandler) SendText(c *fiber.Ctx) error {
	instance, err := h.getInstanceAndValidate(c)
	if err != nil {
		return err
	}

	var req dto.SendTextRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	// Validate JID
	jid := formatJID(req.To)
	if jid == "" {
		return response.BadRequest(c, "Invalid recipient phone number")
	}

	if req.Text == "" {
		return response.BadRequest(c, "Text message is required")
	}

	// Send message
	msgID, err := h.waManager.SendText(c.Context(), instance.ID, jid, req.Text, req.QuoteID, req.MentionJIDs)
	if err != nil {
		h.logger.WithError(err).Error("Failed to send text message")
		return response.InternalServerError(c, "Failed to send message")
	}

	// Save message to database
	if h.messageRepo != nil {
		go func() {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()

			message := entity.NewMessage(instance.ID, jid, entity.MessageTypeText)
			message.MessageID = msgID
			message.FromMe = true
			message.Content = req.Text
			message.Timestamp = time.Now()
			message.Status = entity.MessageStatusSent

			if err := h.messageRepo.Create(ctx, message); err != nil {
				h.logger.WithError(err).Warn("Failed to save sent message to database")
			}
		}()
	}

	return response.Success(c, dto.MessageResponse{
		ID:        uuid.New(),
		MessageID: msgID,
		Status:    "sent",
		Timestamp: time.Now(),
	})
}

// SendMedia sends a media message (image, video, document)
func (h *MessageHandler) SendMedia(c *fiber.Ctx) error {
	instance, err := h.getInstanceAndValidate(c)
	if err != nil {
		return err
	}

	var req dto.SendMediaRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	jid := formatJID(req.To)
	if jid == "" {
		return response.BadRequest(c, "Invalid recipient phone number")
	}

	// Get media data
	var mediaData []byte
	var mimeType string

	if req.Base64 != "" {
		// Decode base64
		data := req.Base64
		if idx := strings.Index(data, ","); idx != -1 {
			data = data[idx+1:]
		}
		mediaData, err = base64.StdEncoding.DecodeString(data)
		if err != nil {
			return response.BadRequest(c, "Invalid base64 data")
		}
		mimeType = req.MimeType
	} else if req.MediaURL != "" {
		// Download from URL
		resp, err := http.Get(req.MediaURL)
		if err != nil {
			return response.BadRequest(c, "Failed to download media from URL")
		}
		defer resp.Body.Close()

		mediaData, err = io.ReadAll(resp.Body)
		if err != nil {
			return response.BadRequest(c, "Failed to read media data")
		}
		mimeType = resp.Header.Get("Content-Type")
		if req.MimeType != "" {
			mimeType = req.MimeType
		}
	} else {
		return response.BadRequest(c, "Either media_url or base64 is required")
	}

	if mimeType == "" {
		mimeType = http.DetectContentType(mediaData)
	}

	// Determine media type and send
	var msgID string
	switch {
	case strings.HasPrefix(mimeType, "image/"):
		msgID, err = h.waManager.SendImage(c.Context(), instance.ID, jid, mediaData, mimeType, req.Caption, req.QuoteID)
	case strings.HasPrefix(mimeType, "video/"):
		msgID, err = h.waManager.SendVideo(c.Context(), instance.ID, jid, mediaData, mimeType, req.Caption, req.QuoteID)
	default:
		fileName := req.FileName
		if fileName == "" {
			fileName = "document"
		}
		msgID, err = h.waManager.SendDocument(c.Context(), instance.ID, jid, mediaData, mimeType, fileName, req.Caption, req.QuoteID)
	}

	if err != nil {
		h.logger.WithError(err).Error("Failed to send media message")
		return response.InternalServerError(c, "Failed to send media")
	}

	return response.Success(c, dto.MessageResponse{
		ID:        uuid.New(),
		MessageID: msgID,
		Status:    "sent",
		Timestamp: time.Now(),
	})
}

// SendAudio sends an audio message
func (h *MessageHandler) SendAudio(c *fiber.Ctx) error {
	instance, err := h.getInstanceAndValidate(c)
	if err != nil {
		return err
	}

	var req dto.SendAudioRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	jid := formatJID(req.To)
	if jid == "" {
		return response.BadRequest(c, "Invalid recipient phone number")
	}

	// Get audio data
	var audioData []byte
	mimeType := "audio/ogg; codecs=opus"

	if req.Base64 != "" {
		data := req.Base64
		if idx := strings.Index(data, ","); idx != -1 {
			data = data[idx+1:]
		}
		audioData, err = base64.StdEncoding.DecodeString(data)
		if err != nil {
			return response.BadRequest(c, "Invalid base64 data")
		}
	} else if req.AudioURL != "" {
		resp, err := http.Get(req.AudioURL)
		if err != nil {
			return response.BadRequest(c, "Failed to download audio from URL")
		}
		defer resp.Body.Close()

		audioData, err = io.ReadAll(resp.Body)
		if err != nil {
			return response.BadRequest(c, "Failed to read audio data")
		}
		if ct := resp.Header.Get("Content-Type"); ct != "" {
			mimeType = ct
		}
	} else {
		return response.BadRequest(c, "Either audio_url or base64 is required")
	}

	msgID, err := h.waManager.SendAudio(c.Context(), instance.ID, jid, audioData, mimeType, req.PTT, req.QuoteID)
	if err != nil {
		h.logger.WithError(err).Error("Failed to send audio message")
		return response.InternalServerError(c, "Failed to send audio")
	}

	return response.Success(c, dto.MessageResponse{
		ID:        uuid.New(),
		MessageID: msgID,
		Status:    "sent",
		Timestamp: time.Now(),
	})
}

// SendSticker sends a sticker message
func (h *MessageHandler) SendSticker(c *fiber.Ctx) error {
	instance, err := h.getInstanceAndValidate(c)
	if err != nil {
		return err
	}

	var req dto.SendStickerRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	jid := formatJID(req.To)
	if jid == "" {
		return response.BadRequest(c, "Invalid recipient phone number")
	}

	// Get sticker data
	var stickerData []byte
	mimeType := "image/webp"

	if req.Base64 != "" {
		data := req.Base64
		if idx := strings.Index(data, ","); idx != -1 {
			data = data[idx+1:]
		}
		stickerData, err = base64.StdEncoding.DecodeString(data)
		if err != nil {
			return response.BadRequest(c, "Invalid base64 data")
		}
	} else if req.StickerURL != "" {
		resp, err := http.Get(req.StickerURL)
		if err != nil {
			return response.BadRequest(c, "Failed to download sticker from URL")
		}
		defer resp.Body.Close()

		stickerData, err = io.ReadAll(resp.Body)
		if err != nil {
			return response.BadRequest(c, "Failed to read sticker data")
		}
	} else {
		return response.BadRequest(c, "Either sticker_url or base64 is required")
	}

	msgID, err := h.waManager.SendSticker(c.Context(), instance.ID, jid, stickerData, mimeType)
	if err != nil {
		h.logger.WithError(err).Error("Failed to send sticker message")
		return response.InternalServerError(c, "Failed to send sticker")
	}

	return response.Success(c, dto.MessageResponse{
		ID:        uuid.New(),
		MessageID: msgID,
		Status:    "sent",
		Timestamp: time.Now(),
	})
}

// SendLocation sends a location message
func (h *MessageHandler) SendLocation(c *fiber.Ctx) error {
	instance, err := h.getInstanceAndValidate(c)
	if err != nil {
		return err
	}

	var req dto.SendLocationRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	jid := formatJID(req.To)
	if jid == "" {
		return response.BadRequest(c, "Invalid recipient phone number")
	}

	msgID, err := h.waManager.SendLocation(c.Context(), instance.ID, jid, req.Latitude, req.Longitude, req.Name, req.Address)
	if err != nil {
		h.logger.WithError(err).Error("Failed to send location message")
		return response.InternalServerError(c, "Failed to send location")
	}

	return response.Success(c, dto.MessageResponse{
		ID:        uuid.New(),
		MessageID: msgID,
		Status:    "sent",
		Timestamp: time.Now(),
	})
}

// SendContact sends a contact card
func (h *MessageHandler) SendContact(c *fiber.Ctx) error {
	instance, err := h.getInstanceAndValidate(c)
	if err != nil {
		return err
	}

	var req dto.SendContactRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	jid := formatJID(req.To)
	if jid == "" {
		return response.BadRequest(c, "Invalid recipient phone number")
	}

	if len(req.Contacts) == 0 {
		return response.BadRequest(c, "At least one contact is required")
	}

	// Convert to entity
	contacts := make([]entity.VCard, len(req.Contacts))
	for i, c := range req.Contacts {
		contacts[i] = entity.VCard{
			FullName:     c.FullName,
			DisplayName:  c.DisplayName,
			Phone:        c.Phone,
			Organization: c.Organization,
		}
	}

	msgID, err := h.waManager.SendContact(c.Context(), instance.ID, jid, contacts)
	if err != nil {
		h.logger.WithError(err).Error("Failed to send contact message")
		return response.InternalServerError(c, "Failed to send contact")
	}

	return response.Success(c, dto.MessageResponse{
		ID:        uuid.New(),
		MessageID: msgID,
		Status:    "sent",
		Timestamp: time.Now(),
	})
}

// SendReaction sends a reaction to a message
func (h *MessageHandler) SendReaction(c *fiber.Ctx) error {
	instance, err := h.getInstanceAndValidate(c)
	if err != nil {
		return err
	}

	var req dto.SendReactionRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	jid := formatJID(req.To)
	if jid == "" {
		return response.BadRequest(c, "Invalid recipient phone number")
	}

	if req.MessageID == "" {
		return response.BadRequest(c, "Message ID is required")
	}

	msgID, err := h.waManager.SendReaction(c.Context(), instance.ID, jid, req.MessageID, req.Emoji)
	if err != nil {
		h.logger.WithError(err).Error("Failed to send reaction")
		return response.InternalServerError(c, "Failed to send reaction")
	}

	return response.Success(c, dto.MessageResponse{
		ID:        uuid.New(),
		MessageID: msgID,
		Status:    "sent",
		Timestamp: time.Now(),
	})
}

// SendPoll sends a poll message
func (h *MessageHandler) SendPoll(c *fiber.Ctx) error {
	instance, err := h.getInstanceAndValidate(c)
	if err != nil {
		return err
	}

	var req dto.SendPollRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	jid := formatJID(req.To)
	if jid == "" {
		return response.BadRequest(c, "Invalid recipient phone number")
	}

	if req.Question == "" {
		return response.BadRequest(c, "Question is required")
	}

	if len(req.Options) < 2 {
		return response.BadRequest(c, "At least 2 options are required")
	}

	selectableCount := req.SelectableCount
	if selectableCount <= 0 {
		selectableCount = 1
	}

	msgID, err := h.waManager.SendPoll(c.Context(), instance.ID, jid, req.Question, req.Options, selectableCount)
	if err != nil {
		h.logger.WithError(err).Error("Failed to send poll")
		return response.InternalServerError(c, "Failed to send poll")
	}

	return response.Success(c, dto.MessageResponse{
		ID:        uuid.New(),
		MessageID: msgID,
		Status:    "sent",
		Timestamp: time.Now(),
	})
}

// SendButton sends a button message using whatsmeow protobufs
func (h *MessageHandler) SendButton(c *fiber.Ctx) error {
	instance, err := h.getInstanceAndValidate(c)
	if err != nil {
		return err
	}

	var req dto.SendButtonRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	// Support UAZAPI format: use "phone" if "to" is empty
	recipient := req.To
	if recipient == "" {
		recipient = req.Phone
	}
	if recipient == "" {
		return response.BadRequest(c, "Invalid recipient phone number (to or phone required)")
	}

	jid := formatJID(recipient)
	if jid == "" {
		return response.BadRequest(c, "Invalid recipient phone number")
	}

	// Support UAZAPI format: use "caption" if "text" is empty
	text := req.Text
	if text == "" {
		text = req.Caption
	}
	if text == "" {
		return response.BadRequest(c, "Text or caption is required")
	}

	if len(req.Buttons) == 0 || len(req.Buttons) > 3 {
		return response.BadRequest(c, "Must have 1-3 buttons")
	}

	// Convert buttons to internal format
	buttons := make([]whatsapp.ButtonData, len(req.Buttons))
	for i, btn := range req.Buttons {
		// Support both new format (buttonId, buttonText) and legacy format (id, text)
		buttonID := btn.ButtonID
		if buttonID == "" {
			buttonID = btn.ID
		}
		buttonText := btn.ButtonText.DisplayText
		if buttonText == "" {
			buttonText = btn.Text
		}
		buttonType := btn.Type
		if buttonType == "" {
			buttonType = "reply" // Default
		}

		buttons[i] = whatsapp.ButtonData{
			ID:    buttonID,
			Text:  buttonText,
			Type:  buttonType,
			URL:   btn.URL,
			Phone: btn.Phone,
		}
	}

	// Handle header if provided
	var header *whatsapp.HeaderData

	// Support UAZAPI format: image at root level or title
	if req.Image != nil && req.Image.URL != "" {
		// Image at root level - convert to header
		header = &whatsapp.HeaderData{
			Type: "image",
		}
		mediaData, err := downloadMediaFromURL(req.Image.URL)
		if err != nil {
			h.logger.WithError(err).Warn("Failed to download image")
		} else {
			header.MediaData = mediaData
			header.MimeType = "image/jpeg" // Default, can be detected from URL
		}
	} else if req.Title != "" {
		// Title at root level - convert to header text
		header = &whatsapp.HeaderData{
			Type: "text",
			Text: req.Title,
		}
	} else if req.Header != nil {
		// Standard header format
		header = &whatsapp.HeaderData{
			Type:     req.Header.Type,
			Text:     req.Header.Text,
			MimeType: req.Header.MimeType,
			FileName: req.Header.FileName,
		}

		// Download media if needed
		if req.Header.MediaURL != "" {
			mediaData, err := downloadMediaFromURL(req.Header.MediaURL)
			if err != nil {
				h.logger.WithError(err).Warn("Failed to download header media")
			} else {
				header.MediaData = mediaData
			}
		} else if req.Header.Base64 != "" {
			mediaData, err := decodeBase64(req.Header.Base64)
			if err != nil {
				return response.BadRequest(c, "Invalid base64 header data")
			}
			header.MediaData = mediaData
		}
	}

	// Send using whatsmeow protobufs
	// Use text (or caption) and footer
	footer := req.Footer
	msgID, err := h.waManager.SendButtons(c.Context(), instance.ID, jid, text, footer, buttons, header)
	if err != nil {
		h.logger.WithError(err).WithFields(logrus.Fields{
			"instance":     instance.Name,
			"to":           jid,
			"buttonsCount": len(buttons),
			"text":         req.Text,
		}).Error("Failed to send button message")
		// Retornar mensagem de erro mais detalhada
		return response.InternalServerError(c, fmt.Sprintf("Failed to send button message: %v", err))
	}

	return response.Success(c, dto.MessageResponse{
		ID:        uuid.New(),
		MessageID: msgID,
		Status:    "sent",
		Timestamp: time.Now(),
	})
}

// SendList sends a list message using whatsmeow protobufs
func (h *MessageHandler) SendList(c *fiber.Ctx) error {
	instance, err := h.getInstanceAndValidate(c)
	if err != nil {
		return err
	}

	var req dto.SendListRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	jid := formatJID(req.To)
	if jid == "" {
		return response.BadRequest(c, "Invalid recipient phone number")
	}

	if len(req.Sections) == 0 || len(req.Sections) > 10 {
		return response.BadRequest(c, "Must have 1-10 sections")
	}

	// Convert sections to internal format
	sections := make([]whatsapp.ListSectionData, len(req.Sections))
	for i, section := range req.Sections {
		rows := make([]whatsapp.ListRowData, len(section.Rows))
		for j, row := range section.Rows {
			rows[j] = whatsapp.ListRowData{
				ID:          row.ID,
				Title:       row.Title,
				Description: row.Description,
			}
		}
		sections[i] = whatsapp.ListSectionData{
			Title: section.Title,
			Rows:  rows,
		}
	}

	// Send using whatsmeow protobufs
	msgID, err := h.waManager.SendList(c.Context(), instance.ID, jid, req.Title, req.Description, req.ButtonText, req.Footer, sections)
	if err != nil {
		h.logger.WithError(err).Error("Failed to send list message")
		return response.InternalServerError(c, "Failed to send list message")
	}

	return response.Success(c, dto.MessageResponse{
		ID:        uuid.New(),
		MessageID: msgID,
		Status:    "sent",
		Timestamp: time.Now(),
	})
}

// SendCarousel sends a carousel message
func (h *MessageHandler) SendCarousel(c *fiber.Ctx) error {
	instance, err := h.getInstanceAndValidate(c)
	if err != nil {
		return err
	}

	var req dto.SendCarouselRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	jid := formatJID(req.To)
	if jid == "" {
		return response.BadRequest(c, "Invalid recipient phone number")
	}

	// Carousel messages are not natively supported
	// Send as multiple messages
	var lastMsgID string
	for _, card := range req.Cards {
		// Download and send image with caption
		if card.MediaURL != "" {
			resp, err := http.Get(card.MediaURL)
			if err != nil {
				continue
			}
			defer resp.Body.Close()

			imageData, err := io.ReadAll(resp.Body)
			if err != nil {
				continue
			}

			caption := "*" + card.Title + "*\n" + card.Description
			mimeType := resp.Header.Get("Content-Type")
			if mimeType == "" {
				mimeType = "image/jpeg"
			}

			lastMsgID, _ = h.waManager.SendImage(c.Context(), instance.ID, jid, imageData, mimeType, caption, "")
		}
	}

	return response.Success(c, dto.MessageResponse{
		ID:        uuid.New(),
		MessageID: lastMsgID,
		Status:    "sent",
		Timestamp: time.Now(),
	})
}

// SendStory sends a story/status message
func (h *MessageHandler) SendStory(c *fiber.Ctx) error {
	instance, err := h.getInstanceAndValidate(c)
	if err != nil {
		return err
	}

	var req dto.SendStoryRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	// Stories are sent to "status@broadcast"
	jid := "status@broadcast"

	var msgID string

	if req.Text != "" {
		// Text story
		msgID, err = h.waManager.SendText(c.Context(), instance.ID, jid, req.Text, "", nil)
	} else {
		// Media story
		var mediaData []byte
		mimeType := req.MimeType

		if req.Base64 != "" {
			data := req.Base64
			if idx := strings.Index(data, ","); idx != -1 {
				data = data[idx+1:]
			}
			mediaData, err = base64.StdEncoding.DecodeString(data)
			if err != nil {
				return response.BadRequest(c, "Invalid base64 data")
			}
		} else if req.MediaURL != "" {
			resp, err := http.Get(req.MediaURL)
			if err != nil {
				return response.BadRequest(c, "Failed to download media from URL")
			}
			defer resp.Body.Close()

			mediaData, err = io.ReadAll(resp.Body)
			if err != nil {
				return response.BadRequest(c, "Failed to read media data")
			}
			if mimeType == "" {
				mimeType = resp.Header.Get("Content-Type")
			}
		} else {
			return response.BadRequest(c, "Either text, media_url, or base64 is required")
		}

		if mimeType == "" {
			mimeType = http.DetectContentType(mediaData)
		}

		switch {
		case strings.HasPrefix(mimeType, "image/"):
			msgID, err = h.waManager.SendImage(c.Context(), instance.ID, jid, mediaData, mimeType, req.Caption, "")
		case strings.HasPrefix(mimeType, "video/"):
			msgID, err = h.waManager.SendVideo(c.Context(), instance.ID, jid, mediaData, mimeType, req.Caption, "")
		default:
			return response.BadRequest(c, "Unsupported media type for story")
		}
	}

	if err != nil {
		h.logger.WithError(err).Error("Failed to send story")
		return response.InternalServerError(c, "Failed to send story")
	}

	return response.Success(c, dto.MessageResponse{
		ID:        uuid.New(),
		MessageID: msgID,
		Status:    "sent",
		Timestamp: time.Now(),
	})
}
