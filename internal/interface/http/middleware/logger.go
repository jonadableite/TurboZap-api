package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

// LoggerMiddleware creates a logging middleware
func LoggerMiddleware(logger *zap.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		// Process request
		err := c.Next()

		// Calculate duration
		duration := time.Since(start)

		// Get status code
		status := c.Response().StatusCode()

		// Log request
		fields := []zap.Field{
			zap.String("method", c.Method()),
			zap.String("path", c.Path()),
			zap.Int("status", status),
			zap.Duration("duration", duration),
			zap.String("ip", c.IP()),
			zap.String("user_agent", c.Get("User-Agent")),
		}

		// Add instance name if available
		if instanceName := c.Locals("instanceName"); instanceName != nil {
			fields = append(fields, zap.String("instance", instanceName.(string)))
		}

		// Add error if present
		if err != nil {
			fields = append(fields, zap.Error(err))
		}

		// Log based on status code
		switch {
		case status >= 500:
			logger.Error("Request completed with server error", fields...)
		case status >= 400:
			logger.Warn("Request completed with client error", fields...)
		case status >= 300:
			logger.Info("Request completed with redirect", fields...)
		default:
			logger.Info("Request completed", fields...)
		}

		return err
	}
}

// RecoverMiddleware creates a recovery middleware that logs panics
func RecoverMiddleware(logger *zap.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		defer func() {
			if r := recover(); r != nil {
				logger.Error("Panic recovered",
					zap.Any("panic", r),
					zap.String("method", c.Method()),
					zap.String("path", c.Path()),
				)

				c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"success": false,
					"error": fiber.Map{
						"message": "Internal server error",
					},
				})
			}
		}()

		return c.Next()
	}
}
