package handler

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
	"github.com/jonadableite/turbozap-api/internal/interface/response"
	"github.com/sirupsen/logrus"
)

// ApiKeyHandler handles CRUD operations for user-owned API keys.
type ApiKeyHandler struct {
	repo   repository.ApiKeyRepository
	logger *logrus.Logger
}

// NewApiKeyHandler creates a new ApiKeyHandler.
func NewApiKeyHandler(repo repository.ApiKeyRepository, logger *logrus.Logger) *ApiKeyHandler {
	return &ApiKeyHandler{
		repo:   repo,
		logger: logger,
	}
}

// Create creates a new API key for the authenticated user.
func (h *ApiKeyHandler) Create(c *fiber.Ctx) error {
	userID, _ := c.Locals("userID").(string)
	if userID == "" && c.Locals("isGlobalAdmin") != true {
		return response.Forbidden(c, "User context required to create API key")
	}

	type createRequest struct {
		Name        string    `json:"name"`
		Permissions []string  `json:"permissions"`
		ExpiresAt   time.Time `json:"expires_at"`
	}

	var req createRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	if req.Name == "" {
		req.Name = "API Key"
	}

	now := time.Now()
	key := &entity.ApiKey{
		ID:          uuid.NewString(),
		Name:        req.Name,
		Key:         uuid.NewString(),
		UserID:      userID,
		Permissions: req.Permissions,
		CreatedAt:   now,
	}

	if !req.ExpiresAt.IsZero() {
		key.ExpiresAt = &req.ExpiresAt
	}

	if err := h.repo.Create(c.Context(), key); err != nil {
		h.logger.WithError(err).Error("failed to create api key")
		return response.InternalServerError(c, "Failed to create API key")
	}

	return response.Created(c, fiber.Map{
		"id":           key.ID,
		"name":         key.Name,
		"key":          key.Key,
		"permissions":  key.Permissions,
		"expires_at":   key.ExpiresAt,
		"created_at":   key.CreatedAt,
		"revoked":      false,
		"user_id":      key.UserID,
		"last_used_at": key.LastUsedAt,
	})
}

// List returns API keys for the authenticated user.
func (h *ApiKeyHandler) List(c *fiber.Ctx) error {
	userID, _ := c.Locals("userID").(string)
	if userID == "" && c.Locals("isGlobalAdmin") != true {
		return response.Forbidden(c, "User context required to list API keys")
	}

	keys, err := h.repo.GetByUserID(c.Context(), userID)
	if err != nil {
		h.logger.WithError(err).Error("failed to list api keys")
		return response.InternalServerError(c, "Failed to list API keys")
	}

	return response.Success(c, fiber.Map{
		"api_keys": keys,
		"total":    len(keys),
	})
}

// Delete revokes an API key owned by the authenticated user.
func (h *ApiKeyHandler) Delete(c *fiber.Ctx) error {
	userID, _ := c.Locals("userID").(string)
	if userID == "" && c.Locals("isGlobalAdmin") != true {
		return response.Forbidden(c, "User context required to delete API key")
	}

	id := c.Params("id")
	if id == "" {
		return response.BadRequest(c, "API key id is required")
	}

	key, err := h.repo.GetByID(c.Context(), id)
	if err != nil {
		h.logger.WithError(err).Error("failed to get api key")
		return response.InternalServerError(c, "Failed to delete API key")
	}
	if key == nil {
		return response.NotFound(c, "API key not found")
	}

	if c.Locals("isGlobalAdmin") != true && key.UserID != "" && key.UserID != userID {
		return response.Forbidden(c, "You don't have access to this API key")
	}

	if err := h.repo.Delete(c.Context(), id); err != nil {
		h.logger.WithError(err).Error("failed to delete api key")
		return response.InternalServerError(c, "Failed to delete API key")
	}

	return response.Success(c, fiber.Map{
		"message": "API key revoked successfully",
	})
}

// Update updates name or expiration of an API key.
func (h *ApiKeyHandler) Update(c *fiber.Ctx) error {
	userID, _ := c.Locals("userID").(string)
	if userID == "" && c.Locals("isGlobalAdmin") != true {
		return response.Forbidden(c, "User context required to update API key")
	}

	id := c.Params("id")
	if id == "" {
		return response.BadRequest(c, "API key id is required")
	}

	key, err := h.repo.GetByID(c.Context(), id)
	if err != nil {
		h.logger.WithError(err).Error("failed to get api key")
		return response.InternalServerError(c, "Failed to update API key")
	}
	if key == nil {
		return response.NotFound(c, "API key not found")
	}

	if c.Locals("isGlobalAdmin") != true && key.UserID != "" && key.UserID != userID {
		return response.Forbidden(c, "You don't have access to this API key")
	}

	type updateRequest struct {
		Name      *string    `json:"name"`
		ExpiresAt *time.Time `json:"expires_at"`
	}

	var req updateRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "Invalid request body")
	}

	if req.Name != nil {
		key.Name = *req.Name
	}
	if req.ExpiresAt != nil {
		key.ExpiresAt = req.ExpiresAt
	}

	if err := h.repo.Update(c.Context(), key); err != nil {
		h.logger.WithError(err).Error("failed to update api key")
		return response.InternalServerError(c, "Failed to update API key")
	}

	return response.Success(c, fiber.Map{
		"id":          key.ID,
		"name":        key.Name,
		"permissions": key.Permissions,
		"expires_at":  key.ExpiresAt,
		"revoked":     key.RevokedAt != nil,
	})
}
