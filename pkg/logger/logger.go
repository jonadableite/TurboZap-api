package logger

import (
	"encoding/json"
	"fmt"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/jonadableite/turbozap-api/pkg/config"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

const (
	// ANSI color codes
	colorReset  = "\033[0m"
	colorBold   = "\033[1m"
	colorBright = "\033[1m"

	// Text colors
	colorGreen   = "\033[32m"
	colorCyan    = "\033[36m"
	colorYellow  = "\033[33m"
	colorRed     = "\033[31m"
	colorMagenta = "\033[35m"
	colorBlue    = "\033[34m"
	colorGray    = "\033[90m"
	colorGold    = "\033[33m"
	colorWhite   = "\033[37m"

	// Background colors
	colorGreenBG  = "\033[42m"
	colorCyanBG   = "\033[46m"
	colorYellowBG = "\033[43m"
	colorRedBG    = "\033[41m"
	colorBlueBG   = "\033[44m"
	colorWhiteBG  = "\033[47m"
)

const (
	// Log emojis
	emojiLog     = "📝"
	emojiInfo    = "ℹ️"
	emojiWarn    = "⚠️"
	emojiError   = "❌"
	emojiDebug   = "🔍"
	emojiVerbose = "📢"
	emojiSuccess = "✅"
)

// Logger wraps zap.Logger with enhanced formatting
type Logger struct {
	zap    *zap.Logger
	config *config.Config
	pid    int
}

// NewLogger creates a new logger instance
func NewLogger(cfg *config.Config) (*Logger, error) {
	var zapLogger *zap.Logger
	var err error

	if cfg.Log.Format == "json" || os.Getenv("ENVIRONMENT") == "production" {
		zapConfig := zap.NewProductionConfig()
		zapLogger, err = zapConfig.Build()
	} else {
		zapConfig := zap.NewDevelopmentConfig()
		zapConfig.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
		zapLogger, err = zapConfig.Build()
	}

	if err != nil {
		return nil, fmt.Errorf("failed to initialize logger: %w", err)
	}

	return &Logger{
		zap:    zapLogger,
		config: cfg,
		pid:    os.Getpid(),
	}, nil
}

// WithContext creates a new logger with a specific context
func (l *Logger) WithContext(context string) *ContextLogger {
	return &ContextLogger{
		logger:  l,
		context: context,
	}
}

// ContextLogger provides context-specific logging
type ContextLogger struct {
	logger  *Logger
	context string
}

// sanitizeLogData removes sensitive information from log data
func sanitizeLogData(data interface{}) interface{} {
	if data == nil {
		return data
	}

	sensitiveKeys := []string{
		"password", "token", "secret", "api_key", "apiKey", "apikey",
		"credentials", "Authorization", "authorization",
		"access_token", "accessToken", "refresh_token", "refreshToken",
	}

	// Try to convert to map for sanitization
	if dataMap, ok := data.(map[string]interface{}); ok {
		sanitized := make(map[string]interface{})
		for k, v := range dataMap {
			keyLower := strings.ToLower(k)
			isSensitive := false
			for _, sensitive := range sensitiveKeys {
				if strings.Contains(keyLower, sensitive) {
					isSensitive = true
					break
				}
			}
			if isSensitive {
				sanitized[k] = "***REDACTED***"
			} else {
				sanitized[k] = v
			}
		}
		return sanitized
	}

	return data
}

// formatMessage formats a log message with timestamp, PID, version, etc.
func (l *Logger) formatMessage(level string, emoji string, context string, message string, fields map[string]interface{}) string {
	timestamp := time.Now().Format("04/11/2006 15:04:05")
	version := l.config.App.Version
	appName := l.config.App.Name

	// Build formatted message similar to the reference image
	var parts []string

	// [AppName API] version - timestamp
	parts = append(parts, fmt.Sprintf("%s[%s API]%s", colorBold+colorWhite, appName, colorReset))
	parts = append(parts, fmt.Sprintf("%sv%s%s", colorWhite, version, colorReset))
	parts = append(parts, "-")
	parts = append(parts, timestamp)

	// Level tag with background color
	levelBG := getLevelBGColor(level)
	levelLabel := getLevelLabel(level)
	parts = append(parts, fmt.Sprintf("  %s%s%s %s%s", levelBG, colorBold+colorWhite, emoji, levelLabel, colorReset))

	// Context tag
	if context != "" {
		parts = append(parts, fmt.Sprintf("  %s[%s]%s", colorBold+colorYellow, context, colorReset))
	}

	// Message
	parts = append(parts, fmt.Sprintf("  %s", message))

	// Fields as key-value pairs
	if len(fields) > 0 {
		sanitizedFields := sanitizeLogData(fields).(map[string]interface{})
		for k, v := range sanitizedFields {
			parts = append(parts, fmt.Sprintf("%s: %v", k, v))
		}
	}

	return strings.Join(parts, " ")
}

// getCallerInfo gets the caller file name (excluding full path)
func getCallerInfo() string {
	_, file, _, ok := runtime.Caller(3)
	if !ok {
		return "[unknown]"
	}

	// Extract just the filename
	parts := strings.Split(file, "/")
	filename := parts[len(parts)-1]

	// Remove extension
	if idx := strings.LastIndex(filename, "."); idx != -1 {
		filename = filename[:idx]
	}

	return filename
}

func getLevelColor(level string) string {
	switch level {
	case "SUCCESS":
		return colorGreen
	case "INFO":
		return colorBlue
	case "WARN":
		return colorYellow
	case "ERROR":
		return colorRed
	case "DEBUG":
		return colorCyan
	case "VERBOSE":
		return colorWhite
	default:
		return colorGreen
	}
}

func getLevelBGColor(level string) string {
	switch level {
	case "SUCCESS":
		return "\033[42m" // Green background
	case "INFO":
		return "\033[46m" // Cyan background
	case "WARN":
		return "\033[43m" // Yellow background
	case "ERROR":
		return "\033[41m" // Red background
	case "DEBUG":
		return "\033[44m" // Blue background
	case "VERBOSE":
		return "\033[47m" // White background
	default:
		return "\033[46m" // Cyan background
	}
}

func getLevelLabel(level string) string {
	switch level {
	case "SUCCESS":
		return " OK "
	case "INFO":
		return " INFO "
	case "WARN":
		return " WARN "
	case "ERROR":
		return " ERROR "
	case "DEBUG":
		return " DEBUG "
	case "VERBOSE":
		return " VERBOSE "
	default:
		return " LOG "
	}
}

// SerializeMessage converts any message to string
func serializeMessage(msg interface{}) string {
	if msg == nil {
		return "null"
	}

	switch v := msg.(type) {
	case string:
		return v
	case error:
		return v.Error()
	default:
		sanitized := sanitizeLogData(msg)
		jsonData, err := json.MarshalIndent(sanitized, "", "  ")
		if err != nil {
			return fmt.Sprintf("%v", sanitized)
		}
		return string(jsonData)
	}
}

// Success logs a success message
func (cl *ContextLogger) Success(message string, fields ...map[string]interface{}) {
	var mergedFields map[string]interface{}
	if len(fields) > 0 {
		mergedFields = fields[0]
	}

	formatted := cl.logger.formatMessage("SUCCESS", emojiSuccess, cl.context, message, mergedFields)
	fmt.Println(formatted)

	// Also log to zap
	zapFields := toZapFields(mergedFields)
	cl.logger.zap.Info(message, zapFields...)
}

// Info logs an info message
func (cl *ContextLogger) Info(message string, fields ...map[string]interface{}) {
	var mergedFields map[string]interface{}
	if len(fields) > 0 {
		mergedFields = fields[0]
	}

	formatted := cl.logger.formatMessage("INFO", emojiInfo, cl.context, message, mergedFields)
	fmt.Println(formatted)

	zapFields := toZapFields(mergedFields)
	cl.logger.zap.Info(message, zapFields...)
}

// Warn logs a warning message
func (cl *ContextLogger) Warn(message string, fields ...map[string]interface{}) {
	var mergedFields map[string]interface{}
	if len(fields) > 0 {
		mergedFields = fields[0]
	}

	formatted := cl.logger.formatMessage("WARN", emojiWarn, cl.context, message, mergedFields)
	fmt.Println(formatted)

	zapFields := toZapFields(mergedFields)
	cl.logger.zap.Warn(message, zapFields...)
}

// Error logs an error message
func (cl *ContextLogger) Error(message string, err error, fields ...map[string]interface{}) {
	var mergedFields map[string]interface{}
	if len(fields) > 0 {
		mergedFields = fields[0]
	}

	if err != nil {
		if mergedFields == nil {
			mergedFields = make(map[string]interface{})
		}
		mergedFields["error"] = err.Error()
		if err.Error() != "" {
			message = fmt.Sprintf("%s: %s", message, err.Error())
		}
	}

	formatted := cl.logger.formatMessage("ERROR", emojiError, cl.context, message, mergedFields)
	fmt.Println(formatted)

	zapFields := toZapFields(mergedFields)
	if err != nil {
		cl.logger.zap.Error(message, append(zapFields, zap.Error(err))...)
	} else {
		cl.logger.zap.Error(message, zapFields...)
	}
}

// Debug logs a debug message (only if DEBUG=true)
func (cl *ContextLogger) Debug(message string, fields ...map[string]interface{}) {
	if os.Getenv("DEBUG") != "true" && cl.logger.config.Log.Level != "debug" {
		return
	}

	var mergedFields map[string]interface{}
	if len(fields) > 0 {
		mergedFields = fields[0]
	}

	formatted := cl.logger.formatMessage("DEBUG", emojiDebug, cl.context, message, mergedFields)
	fmt.Println(formatted)

	zapFields := toZapFields(mergedFields)
	cl.logger.zap.Debug(message, zapFields...)
}

// Verbose logs a verbose message
func (cl *ContextLogger) Verbose(message string, fields ...map[string]interface{}) {
	var mergedFields map[string]interface{}
	if len(fields) > 0 {
		mergedFields = fields[0]
	}

	formatted := cl.logger.formatMessage("VERBOSE", emojiVerbose, cl.context, message, mergedFields)
	fmt.Println(formatted)

	zapFields := toZapFields(mergedFields)
	cl.logger.zap.Debug(message, zapFields...)
}

// Log logs a generic log message
func (cl *ContextLogger) Log(message string, fields ...map[string]interface{}) {
	var mergedFields map[string]interface{}
	if len(fields) > 0 {
		mergedFields = fields[0]
	}

	formatted := cl.logger.formatMessage("LOG", emojiLog, cl.context, message, mergedFields)
	fmt.Println(formatted)

	zapFields := toZapFields(mergedFields)
	cl.logger.zap.Info(message, zapFields...)
}

// toZapFields converts map to zap fields
func toZapFields(fields map[string]interface{}) []zap.Field {
	if fields == nil {
		return nil
	}

	zapFields := make([]zap.Field, 0, len(fields))
	for k, v := range fields {
		zapFields = append(zapFields, zap.Any(k, v))
	}
	return zapFields
}

// Sync flushes any buffered log entries
func (l *Logger) Sync() error {
	return l.zap.Sync()
}

// GetZap returns the underlying zap logger for compatibility
func (l *Logger) GetZap() *zap.Logger {
	return l.zap
}
