package middleware

import (
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
	"github.com/jonadableite/turbozap-api/internal/interface/response"
	"github.com/jonadableite/turbozap-api/pkg/config"
)

// AuthMiddleware authenticates requests using:
// 1) Global API key (admin, full access)
// 2) User API key (table api_keys) -> sets userID in context
// 3) Instance-specific API key (legacy) -> sets instance in context
func AuthMiddleware(cfg *config.Config, instanceRepo repository.InstanceRepository, apiKeyRepo repository.ApiKeyRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get API key from header
		apiKey := c.Get("X-API-Key")
		if apiKey == "" {
			// Try Authorization header with Bearer token
			auth := c.Get("Authorization")
			if strings.HasPrefix(auth, "Bearer ") {
				apiKey = strings.TrimPrefix(auth, "Bearer ")
			}
		}

		if apiKey == "" {
			return response.Unauthorized(c, "API key is required")
		}

		// Check if it's the global API key
		if cfg.Server.APIKey != "" && apiKey == cfg.Server.APIKey {
			c.Locals("isGlobalAdmin", true)
			return c.Next()
		}

		// Check if it's a user-owned API key (table api_keys)
		if apiKeyRepo != nil {
			apiKeyEntity, err := apiKeyRepo.GetByKey(c.Context(), apiKey)
			if err != nil {
				return response.InternalServerError(c, "Failed to validate API key")
			}

			now := time.Now()
			if apiKeyEntity != nil && apiKeyEntity.IsValid(now) {
				c.Locals("userID", apiKeyEntity.UserID)
				c.Locals("userApiKeyID", apiKeyEntity.ID)

				// Best-effort update of last_used_at
				_ = apiKeyRepo.UpdateLastUsed(c.Context(), apiKeyEntity.ID, now)
				return c.Next()
			}
		}

		// Check if it's an instance-specific API key
		instance, err := instanceRepo.GetByAPIKey(c.Context(), apiKey)
		if err != nil {
			return response.InternalServerError(c, "Failed to validate API key")
		}

		if instance == nil {
			return response.Unauthorized(c, "Invalid API key")
		}

		// Store instance info in context
		c.Locals("instance", instance)
		c.Locals("instanceID", instance.ID)
		c.Locals("instanceName", instance.Name)
		
		// Also set userID from instance if it exists (for authorization and filtering)
		// This ensures List() can filter by userID even when using instance API key
		if instance.UserID != "" {
			c.Locals("instanceUserID", instance.UserID)
			// Set userID in context so List() can filter correctly
			c.Locals("userID", instance.UserID)
		}

		return c.Next()
	}
}

// OptionalAuthMiddleware creates an optional authentication middleware
// It doesn't require authentication but will set context if provided
func OptionalAuthMiddleware(cfg *config.Config, instanceRepo repository.InstanceRepository, apiKeyRepo repository.ApiKeyRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get API key from header
		apiKey := c.Get("X-API-Key")
		if apiKey == "" {
			auth := c.Get("Authorization")
			if strings.HasPrefix(auth, "Bearer ") {
				apiKey = strings.TrimPrefix(auth, "Bearer ")
			}
		}

		if apiKey == "" {
			return c.Next()
		}

		// Check if it's the global API key
		if cfg.Server.APIKey != "" && apiKey == cfg.Server.APIKey {
			c.Locals("isGlobalAdmin", true)
			return c.Next()
		}

		// Check user-owned API key
		if apiKeyRepo != nil {
			apiKeyEntity, err := apiKeyRepo.GetByKey(c.Context(), apiKey)
			if err == nil && apiKeyEntity != nil && apiKeyEntity.IsValid(time.Now()) {
				c.Locals("userID", apiKeyEntity.UserID)
				c.Locals("userApiKeyID", apiKeyEntity.ID)
				return c.Next()
			}
		}

		// Check if it's an instance-specific API key
		instance, err := instanceRepo.GetByAPIKey(c.Context(), apiKey)
		if err != nil || instance == nil {
			return c.Next()
		}

		c.Locals("instance", instance)
		c.Locals("instanceID", instance.ID)
		c.Locals("instanceName", instance.Name)

		return c.Next()
	}
}

// GlobalAdminMiddleware requires global admin authentication
func GlobalAdminMiddleware(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		apiKey := c.Get("X-API-Key")
		if apiKey == "" {
			auth := c.Get("Authorization")
			if strings.HasPrefix(auth, "Bearer ") {
				apiKey = strings.TrimPrefix(auth, "Bearer ")
			}
		}

		if apiKey == "" {
			return response.Unauthorized(c, "API key is required")
		}

		if cfg.Server.APIKey == "" || apiKey != cfg.Server.APIKey {
			return response.Forbidden(c, "Global admin access required")
		}

		c.Locals("isGlobalAdmin", true)
		return c.Next()
	}
}

// InstanceAuthMiddleware ensures the request is for a specific instance
func InstanceAuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Check if user is global admin (can access any instance)
		if c.Locals("isGlobalAdmin") == true {
			return c.Next()
		}

		// Get instance name from params
		instanceName := c.Params("instance")
		if instanceName == "" {
			return c.Next()
		}

		// Check if authenticated instance matches the requested instance
		authInstanceName := c.Locals("instanceName")
		if authInstanceName != nil && authInstanceName.(string) == instanceName {
			return c.Next()
		}

		return response.Forbidden(c, "You don't have access to this instance")
	}
}
