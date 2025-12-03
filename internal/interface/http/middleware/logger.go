package middleware

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
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

		// Compose colorful log line for quick debugging
		statusIcon, statusColor := statusStyle(status)
		methodColor := methodStyle(c.Method())
		durationColor := durationStyle(duration)
		durationStr := duration.Round(time.Microsecond).String()
		instanceLabel := ""
		if instanceName := c.Locals("instanceName"); instanceName != nil {
			instanceLabel = fmt.Sprintf(" %s[%s]%s", colorMagenta, instanceName.(string), colorReset)
		}
		userAgent := truncateString(c.Get("User-Agent"), 80)
		logLine := fmt.Sprintf("%s%s %s%-6s%s %s%s%s %s%3d%s %s%-10s%s %s%-18s%s %sua=%s%s%s",
			statusColor, statusIcon, methodColor, c.Method(), colorReset,
			colorBold, c.Path(), colorReset,
			statusColor, status, colorReset,
			durationColor, durationStr, colorReset,
			colorCyan, fmt.Sprintf("ip=%s", c.IP()), colorReset, instanceLabel,
			colorGray, userAgent, colorReset,
		)

		logger.Info(logLine,
			zap.String("method", c.Method()),
			zap.String("path", c.Path()),
			zap.String("status_icon", statusIcon),
			zap.Int("status", status),
			zap.Duration("duration", duration),
			zap.String("ip", c.IP()),
			zap.String("user_agent", c.Get("User-Agent")),
		)

		return err
	}
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
