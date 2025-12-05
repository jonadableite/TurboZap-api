package logger

import (
	"github.com/sirupsen/logrus"
)

// ZapCompat provides compatibility layer for zap.Logger API
// This allows gradual migration from zap to logrus
type ZapCompat struct {
	logger *logrus.Logger
	entry  *logrus.Entry
}

// NewZapCompat creates a new zap-compatible logger wrapper
func NewZapCompat(logger *logrus.Logger) *ZapCompat {
	return &ZapCompat{
		logger: logger,
		entry:  logger.WithFields(logrus.Fields{}),
	}
}

// With creates a new logger with fields
func (z *ZapCompat) With(fields ...Field) *ZapCompat {
	logrusFields := logrus.Fields{}
	for _, f := range fields {
		logrusFields[f.Key] = f.Value
	}
	return &ZapCompat{
		logger: z.logger,
		entry:  z.entry.WithFields(logrusFields),
	}
}

// Info logs an info message
func (z *ZapCompat) Info(msg string, fields ...Field) {
	entry := z.entry
	for _, f := range fields {
		entry = entry.WithField(f.Key, f.Value)
	}
	entry.Info(msg)
}

// Warn logs a warning message
func (z *ZapCompat) Warn(msg string, fields ...Field) {
	entry := z.entry
	for _, f := range fields {
		entry = entry.WithField(f.Key, f.Value)
	}
	entry.Warn(msg)
}

// Error logs an error message
func (z *ZapCompat) Error(msg string, fields ...Field) {
	entry := z.entry
	for _, f := range fields {
		if f.Key == "error" {
			if err, ok := f.Value.(error); ok {
				entry = entry.WithError(err)
			} else {
				entry = entry.WithField(f.Key, f.Value)
			}
		} else {
			entry = entry.WithField(f.Key, f.Value)
		}
	}
	entry.Error(msg)
}

// Debug logs a debug message
func (z *ZapCompat) Debug(msg string, fields ...Field) {
	entry := z.entry
	for _, f := range fields {
		entry = entry.WithField(f.Key, f.Value)
	}
	entry.Debug(msg)
}

// Fatal logs a fatal message and exits
func (z *ZapCompat) Fatal(msg string, fields ...Field) {
	entry := z.entry
	for _, f := range fields {
		if f.Key == "error" {
			if err, ok := f.Value.(error); ok {
				entry = entry.WithError(err)
			} else {
				entry = entry.WithField(f.Key, f.Value)
			}
		} else {
			entry = entry.WithField(f.Key, f.Value)
		}
	}
	entry.Fatal(msg)
}

// Field represents a log field (zap-compatible)
type Field struct {
	Key   string
	Value interface{}
}

// String creates a string field
func String(key, value string) Field {
	return Field{Key: key, Value: value}
}

// Any creates an any field
func Any(key string, value interface{}) Field {
	return Field{Key: key, Value: value}
}

// Error creates an error field
func Error(err error) Field {
	return Field{Key: "error", Value: err}
}

// Int creates an int field
func Int(key string, value int) Field {
	return Field{Key: key, Value: value}
}

// GetZapCompat returns a zap-compatible logger wrapper
func (l *Logger) GetZapCompat() *ZapCompat {
	return NewZapCompat(l.logrus)
}

