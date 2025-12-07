package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
	"github.com/jonadableite/turbozap-api/internal/interface/response"
	"github.com/sirupsen/logrus"
)

// StatsHandler handles statistics-related requests
type StatsHandler struct {
	messageRepo repository.MessageRepository
	logger      *logrus.Logger
}

// NewStatsHandler creates a new stats handler
func NewStatsHandler(messageRepo repository.MessageRepository, logger *logrus.Logger) *StatsHandler {
	return &StatsHandler{
		messageRepo: messageRepo,
		logger:      logger,
	}
}

// GetMessageStats returns message statistics
func (h *StatsHandler) GetMessageStats(c *fiber.Ctx) error {
	// Optional instance filter
	var instanceID *uuid.UUID
	if instanceName := c.Query("instance"); instanceName != "" {
		// If instance name is provided, we'd need instanceRepo to resolve it
		// For now, we'll return all stats
	}

	todayCount, err := h.messageRepo.CountToday(c.Context(), instanceID)
	if err != nil {
		h.logger.WithError(err).Error("Failed to count messages today")
		return response.InternalServerError(c, "Failed to get today's message count")
	}

	totalCount, err := h.messageRepo.CountTotal(c.Context(), instanceID)
	if err != nil {
		h.logger.WithError(err).Error("Failed to count total messages")
		return response.InternalServerError(c, "Failed to get total message count")
	}

	return response.Success(c, fiber.Map{
		"today": todayCount,
		"total": totalCount,
	})
}

