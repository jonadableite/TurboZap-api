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
	messageRepo  repository.MessageRepository
	instanceRepo repository.InstanceRepository
	logger       *logrus.Logger
}

// NewStatsHandler creates a new stats handler
func NewStatsHandler(messageRepo repository.MessageRepository, instanceRepo repository.InstanceRepository, logger *logrus.Logger) *StatsHandler {
	return &StatsHandler{
		messageRepo:  messageRepo,
		instanceRepo: instanceRepo,
		logger:       logger,
	}
}

// GetMessageStats returns message statistics filtered by user's instances
func (h *StatsHandler) GetMessageStats(c *fiber.Ctx) error {
	userID, _ := c.Locals("userID").(string)
	isGlobal := c.Locals("isGlobalAdmin") == true

	var instanceIDs []uuid.UUID

	// If user is authenticated with user API key, filter by their instances
	if userID != "" && !isGlobal {
		instances, err := h.instanceRepo.GetByUserID(c.Context(), userID)
		if err != nil {
			h.logger.WithError(err).Error("Failed to get user instances")
			return response.InternalServerError(c, "Failed to get user instances")
		}
		// Extract instance IDs
		for _, instance := range instances {
			instanceIDs = append(instanceIDs, instance.ID)
		}
	} else if isGlobal {
		// Global admin sees all messages - don't filter
		instanceIDs = nil
	} else {
		// No user context - return zero stats
		return response.Success(c, fiber.Map{
			"today": 0,
			"total": 0,
		})
	}

	var todayCount, totalCount int64
	var err error

	if instanceIDs == nil {
		// Count all messages (global admin)
		todayCount, err = h.messageRepo.CountToday(c.Context(), nil)
		if err != nil {
			h.logger.WithError(err).Error("Failed to count messages today")
			return response.InternalServerError(c, "Failed to get today's message count")
		}

		totalCount, err = h.messageRepo.CountTotal(c.Context(), nil)
		if err != nil {
			h.logger.WithError(err).Error("Failed to count total messages")
			return response.InternalServerError(c, "Failed to get total message count")
		}
	} else if len(instanceIDs) > 0 {
		// Count messages for user's instances
		todayCount, err = h.messageRepo.CountTodayByInstances(c.Context(), instanceIDs)
		if err != nil {
			h.logger.WithError(err).Error("Failed to count messages today")
			return response.InternalServerError(c, "Failed to get today's message count")
		}

		totalCount, err = h.messageRepo.CountTotalByInstances(c.Context(), instanceIDs)
		if err != nil {
			h.logger.WithError(err).Error("Failed to count total messages")
			return response.InternalServerError(c, "Failed to get total message count")
		}
	} else {
		// User has no instances - return zero
		todayCount = 0
		totalCount = 0
	}

	return response.Success(c, fiber.Map{
		"today": todayCount,
		"total": totalCount,
	})
}

