package middleware

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
)

const (
	colorReset = "\033[0m"
	colorBold  = "\033[1m"

	colorGreen   = "\033[32m"
	colorCyan    = "\033[36m"
	colorYellow  = "\033[33m"
	colorRed     = "\033[31m"
	colorMagenta = "\033[35m"
	colorBlue    = "\033[34m"
	colorGray    = "\033[90m"
)

// LoggerMiddleware creates a logging middleware with beautiful logrus formatting
func LoggerMiddleware(logger *logrus.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		// Process request
		err := c.Next()

		// Calculate duration
		duration := time.Since(start)
		durationStr := formatDuration(duration)

		// Get status code
		status := c.Response().StatusCode()

		// Build metadata
		metadata := logrus.Fields{
			"method":   c.Method(),
			"path":     c.Path(),
			"status":   status,
			"duration": durationStr,
			"ip":       c.IP(),
			"user_agent": truncateString(c.Get("User-Agent"), 80),
		}

		// Add instance name if available
		if instanceName := c.Locals("instanceName"); instanceName != nil {
			metadata["instance"] = instanceName.(string)
		}

		// Log with appropriate level based on status
		entry := logger.WithFields(metadata)
		if status >= 500 {
			entry.Error("HTTP Request")
		} else if status >= 400 {
			entry.Warn("HTTP Request")
		} else {
			entry.Info("HTTP Request")
		}

		return err
	}
}

// formatDuration formats duration as "44ms" or "1.2s"
func formatDuration(d time.Duration) string {
	if d < time.Second {
		return fmt.Sprintf("%dms", d.Milliseconds())
	}
	return fmt.Sprintf("%.2fs", d.Seconds())
}

func statusStyle(status int) (string, string) {
	switch {
	case status >= 500:
		return "✖", colorRed
	case status >= 400:
		return "⚠", colorYellow
	case status >= 300:
		return "➡", colorBlue
	default:
		return "✔", colorGreen
	}
}

func methodStyle(method string) string {
	switch method {
	case fiber.MethodGet:
		return colorCyan
	case fiber.MethodPost:
		return colorGreen
	case fiber.MethodPut, fiber.MethodPatch:
		return colorYellow
	case fiber.MethodDelete:
		return colorRed
	default:
		return colorBlue
	}
}

func durationStyle(d time.Duration) string {
	switch {
	case d < 200*time.Millisecond:
		return colorGreen
	case d < 800*time.Millisecond:
		return colorYellow
	default:
		return colorRed
	}
}

func truncateString(s string, length int) string {
	if length <= 0 || len(s) <= length {
		return s
	}
	if length <= 3 {
		return s[:length]
	}
	return s[:length-3] + "..."
}

// RecoverMiddleware creates a recovery middleware that logs panics
func RecoverMiddleware(logger *logrus.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		defer func() {
			if r := recover(); r != nil {
				logger.WithFields(logrus.Fields{
					"panic":  r,
					"method": c.Method(),
					"path":   c.Path(),
				}).Error("Panic recovered")

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
