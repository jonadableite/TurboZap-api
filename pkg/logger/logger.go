package logger

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/jonadableite/turbozap-api/pkg/config"
	"github.com/sirupsen/logrus"
)

const (
	// ANSI color codes
	colorReset  = "\033[0m"
	colorBold   = "\033[1m"
	colorDim    = "\033[2m"
	colorItalic = "\033[3m"

	// Text colors
	colorBlack   = "\033[30m"
	colorRed     = "\033[31m"
	colorGreen   = "\033[32m"
	colorYellow  = "\033[33m"
	colorBlue    = "\033[34m"
	colorMagenta = "\033[35m"
	colorCyan    = "\033[36m"
	colorWhite   = "\033[37m"
	colorGray    = "\033[90m"

	// Bright colors
	colorBrightBlack   = "\033[90m"
	colorBrightRed     = "\033[91m"
	colorBrightGreen   = "\033[92m"
	colorBrightYellow  = "\033[93m"
	colorBrightBlue    = "\033[94m"
	colorBrightMagenta = "\033[95m"
	colorBrightCyan    = "\033[96m"
	colorBrightWhite   = "\033[97m"

	// Background colors
	colorBGBlack   = "\033[40m"
	colorBGRed     = "\033[41m"
	colorBGGreen   = "\033[42m"
	colorBGYellow  = "\033[43m"
	colorBGBlue    = "\033[44m"
	colorBGMagenta = "\033[45m"
	colorBGCyan    = "\033[46m"
	colorBGWhite   = "\033[47m"
)

const (
	// Log emojis
	emojiLog     = "📝"
	emojiInfo    = "🚀"
	emojiWarn    = "⚠️"
	emojiError   = "❌"
	emojiDebug   = "🔍"
	emojiSuccess = "✅"
	emojiFatal   = "💀"
	emojiTrace   = "🔎"
	emojiPanic   = "🚨"
)

// Logger wraps logrus.Logger with enhanced formatting
type Logger struct {
	logrus *logrus.Logger
	config *config.Config
	pid    int
}

// ContextLogger provides context-specific logging
type ContextLogger struct {
	logger  *Logger
	context string
}

// BeautifulFormatter is a custom formatter for logrus with beautiful colors
type BeautifulFormatter struct {
	config *config.Config
}

// Format formats the log entry
func (f *BeautifulFormatter) Format(entry *logrus.Entry) ([]byte, error) {
	var b strings.Builder

	// Get level emoji and color
	levelColor, _, emoji := f.getLevelStyle(entry.Level)
	levelLabel := f.getLevelLabel(entry.Level)

	// Timestamp
	timestamp := time.Now().Format("2006-01-02 15:04:05")

	// Build main line: 🚀  INFO  2025-02-05 12:31:13 | POST /login | 200 | 44ms
	b.WriteString(fmt.Sprintf("%s  %s%s%s%s%s  %s%s%s%s%s | ",
		emoji,
		colorBold+levelColor, levelLabel, colorReset,
		timestamp,
	))

	// Extract HTTP method, path, status, duration from fields
	method := ""
	path := ""
	status := ""
	duration := ""
	metadata := make(map[string]interface{})

	for k, v := range entry.Data {
		switch k {
		case "method":
			if m, ok := v.(string); ok {
				method = m
			}
		case "path", "route":
			if p, ok := v.(string); ok {
				path = p
			}
		case "status", "status_code":
			if s, ok := v.(int); ok {
				status = fmt.Sprintf("%d", s)
			} else if s, ok := v.(string); ok {
				status = s
			}
		case "duration", "latency", "time":
			if d, ok := v.(string); ok {
				duration = d
			} else if d, ok := v.(time.Duration); ok {
				duration = d.String()
			} else if d, ok := v.(float64); ok {
				duration = fmt.Sprintf("%.0fms", d)
			}
		case "context":
			// Skip context, it's handled separately
		default:
			// Add to metadata
			metadata[k] = v
		}
	}

	// Build HTTP info line
	if method != "" && path != "" {
		b.WriteString(fmt.Sprintf("%s%s%s %s%s%s%s%s | ",
			colorBrightCyan, method, colorReset,
			colorBrightWhite, path, colorReset,
		))
	}

	if status != "" {
		statusColor := colorBrightGreen
		if strings.HasPrefix(status, "4") || strings.HasPrefix(status, "5") {
			statusColor = colorBrightRed
		} else if strings.HasPrefix(status, "3") {
			statusColor = colorBrightYellow
		}
		b.WriteString(fmt.Sprintf("%s%s%s%s%s | ",
			statusColor, status, colorReset,
		))
	}

	if duration != "" {
		b.WriteString(fmt.Sprintf("%s%s%s",
			colorBrightMagenta, duration, colorReset,
		))
	}

	// If no HTTP info, just show the message
	if method == "" && path == "" && status == "" {
		b.WriteString(fmt.Sprintf("%s%s%s", levelColor, entry.Message, colorReset))
	}

	b.WriteString("\n")

	// Add JSON metadata if there are fields
	if len(metadata) > 0 {
		// Build JSON object
		jsonData := make(map[string]interface{})
		for k, v := range metadata {
			// Sanitize sensitive data
			jsonData[k] = sanitizeValue(k, v)
		}
		// Add error if present
		if entry.Data["error"] != nil {
			if err, ok := entry.Data["error"].(error); ok {
				jsonData["error"] = err.Error()
			} else {
				jsonData["error"] = entry.Data["error"]
			}
		}

		if len(jsonData) > 0 {
			jsonBytes, err := json.MarshalIndent(jsonData, "", "   ")
			if err == nil {
				b.WriteString(string(jsonBytes))
				b.WriteString("\n")
			}
		}
	}

	return []byte(b.String()), nil
}

// sanitizeValue removes sensitive information from values
func sanitizeValue(key string, value interface{}) interface{} {
	keyLower := strings.ToLower(key)
	sensitiveKeys := []string{
		"password", "token", "secret", "api_key", "apikey",
		"credentials", "authorization", "access_token", "refresh_token",
	}

	for _, sensitive := range sensitiveKeys {
		if strings.Contains(keyLower, sensitive) {
			return "***REDACTED***"
		}
	}

	return value
}

func (f *BeautifulFormatter) getLevelStyle(level logrus.Level) (color, bg, emoji string) {
	switch level {
	case logrus.PanicLevel:
		return colorBrightRed, colorBGRed, emojiPanic
	case logrus.FatalLevel:
		return colorBrightRed, colorBGRed, emojiFatal
	case logrus.ErrorLevel:
		return colorBrightRed, colorBGRed, emojiError
	case logrus.WarnLevel:
		return colorBrightYellow, colorBGYellow, emojiWarn
	case logrus.InfoLevel:
		return colorBrightBlue, colorBGCyan, emojiInfo
	case logrus.DebugLevel:
		return colorBrightMagenta, colorBGBlue, emojiDebug
	case logrus.TraceLevel:
		return colorBrightCyan, colorBGCyan, emojiTrace
	default:
		return colorWhite, colorBGWhite, emojiLog
	}
}

func (f *BeautifulFormatter) getLevelLabel(level logrus.Level) string {
	switch level {
	case logrus.PanicLevel:
		return "PANIC"
	case logrus.FatalLevel:
		return "FATAL"
	case logrus.ErrorLevel:
		return "ERROR"
	case logrus.WarnLevel:
		return "WARN"
	case logrus.InfoLevel:
		return "INFO"
	case logrus.DebugLevel:
		return "DEBUG"
	case logrus.TraceLevel:
		return "TRACE"
	default:
		return "LOG"
	}
}

// NewLogger creates a new logger instance with beautiful formatting
func NewLogger(cfg *config.Config) (*Logger, error) {
	logrusLogger := logrus.New()

	// Set output to stdout
	logrusLogger.SetOutput(os.Stdout)

	// Set formatter
	logrusLogger.SetFormatter(&BeautifulFormatter{config: cfg})

	// Set report caller for file:line info
	logrusLogger.SetReportCaller(false) // Disabled for cleaner output

	// Set log level
	level, err := logrus.ParseLevel(cfg.Log.Level)
	if err != nil {
		level = logrus.InfoLevel
	}
	logrusLogger.SetLevel(level)

	// Enable colors (always for terminal)
	logrusLogger.SetOutput(&ColorWriter{Writer: os.Stdout})

	return &Logger{
		logrus: logrusLogger,
		config: cfg,
		pid:    os.Getpid(),
	}, nil
}

// ColorWriter wraps io.Writer to ensure colors are enabled
type ColorWriter struct {
	Writer io.Writer
}

func (cw *ColorWriter) Write(p []byte) (n int, err error) {
	return cw.Writer.Write(p)
}

// WithContext creates a new logger with a specific context
func (l *Logger) WithContext(context string) *ContextLogger {
	return &ContextLogger{
		logger:  l,
		context: context,
	}
}

// GetLogrus returns the underlying logrus logger for compatibility
func (l *Logger) GetLogrus() *logrus.Logger {
	return l.logrus
}

// AddHook adds a hook to the logger
func (l *Logger) AddHook(hook logrus.Hook) {
	l.logrus.AddHook(hook)
}

// SetLevel sets the log level
func (l *Logger) SetLevel(level logrus.Level) {
	l.logrus.SetLevel(level)
}

// SetOutput sets the output writer
func (l *Logger) SetOutput(w io.Writer) {
	l.logrus.SetOutput(w)
}

// Success logs a success message
func (cl *ContextLogger) Success(message string, fields ...map[string]interface{}) {
	entry := cl.logger.logrus.WithFields(logrus.Fields{
		"context": cl.context,
	})

	if len(fields) > 0 {
		for k, v := range fields[0] {
			entry = entry.WithField(k, v)
		}
	}

	// Use Info level but with success styling
	entry.Info(message)
}

// Info logs an info message
func (cl *ContextLogger) Info(message string, fields ...map[string]interface{}) {
	entry := cl.logger.logrus.WithFields(logrus.Fields{
		"context": cl.context,
	})

	if len(fields) > 0 {
		for k, v := range fields[0] {
			entry = entry.WithField(k, v)
		}
	}

	entry.Info(message)
}

// Warn logs a warning message
func (cl *ContextLogger) Warn(message string, fields ...map[string]interface{}) {
	entry := cl.logger.logrus.WithFields(logrus.Fields{
		"context": cl.context,
	})

	if len(fields) > 0 {
		for k, v := range fields[0] {
			entry = entry.WithField(k, v)
		}
	}

	entry.Warn(message)
}

// Error logs an error message
func (cl *ContextLogger) Error(message string, err error, fields ...map[string]interface{}) {
	entry := cl.logger.logrus.WithFields(logrus.Fields{
		"context": cl.context,
	})

	if err != nil {
		entry = entry.WithError(err)
	}

	if len(fields) > 0 {
		for k, v := range fields[0] {
			entry = entry.WithField(k, v)
		}
	}

	entry.Error(message)
}

// Debug logs a debug message
func (cl *ContextLogger) Debug(message string, fields ...map[string]interface{}) {
	entry := cl.logger.logrus.WithFields(logrus.Fields{
		"context": cl.context,
	})

	if len(fields) > 0 {
		for k, v := range fields[0] {
			entry = entry.WithField(k, v)
		}
	}

	entry.Debug(message)
}

// Verbose logs a verbose message (alias for Debug)
func (cl *ContextLogger) Verbose(message string, fields ...map[string]interface{}) {
	cl.Debug(message, fields...)
}

// Log logs a generic log message
func (cl *ContextLogger) Log(message string, fields ...map[string]interface{}) {
	cl.Info(message, fields...)
}

// Sync flushes any buffered log entries (compatibility method)
func (l *Logger) Sync() error {
	// Logrus doesn't need explicit syncing, but we keep this for compatibility
	return nil
}

// GetZap returns nil (compatibility method - deprecated)
func (l *Logger) GetZap() interface{} {
	return nil
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
