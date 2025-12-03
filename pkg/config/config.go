package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the application
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	WhatsApp WhatsAppConfig
	Webhook  WebhookConfig
	Log      LogConfig
}

// ServerConfig holds server-related configuration
type ServerConfig struct {
	Port   string
	Host   string
	APIKey string
}

// DatabaseConfig holds database-related configuration
type DatabaseConfig struct {
	URL      string
	Host     string
	Port     string
	User     string
	Password string
	Name     string
}

// WhatsAppConfig holds WhatsApp-related configuration
type WhatsAppConfig struct {
	Debug             bool
	AutoReconnect     bool
	ReconnectInterval int
}

// WebhookConfig holds webhook-related configuration
type WebhookConfig struct {
	Timeout    int
	RetryCount int
}

// LogConfig holds logging-related configuration
type LogConfig struct {
	Level  string
	Format string
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	// Load .env file if it exists
	_ = godotenv.Load()

	cfg := &Config{
		Server: ServerConfig{
			Port:   getEnv("SERVER_PORT", "8080"),
			Host:   getEnv("SERVER_HOST", "0.0.0.0"),
			APIKey: getEnv("API_KEY", ""),
		},
		Database: DatabaseConfig{
			URL:      getEnv("DATABASE_URL", ""),
			Host:     getEnv("DATABASE_HOST", "localhost"),
			Port:     getEnv("DATABASE_PORT", "5432"),
			User:     getEnv("DATABASE_USER", "postgres"),
			Password: getEnv("DATABASE_PASSWORD", "postgres"),
			Name:     getEnv("DATABASE_NAME", "turbozap"),
		},
		WhatsApp: WhatsAppConfig{
			Debug:             getEnvBool("WHATSAPP_DEBUG", false),
			AutoReconnect:     getEnvBool("WHATSAPP_AUTO_RECONNECT", true),
			ReconnectInterval: getEnvInt("WHATSAPP_RECONNECT_INTERVAL", 5),
		},
		Webhook: WebhookConfig{
			Timeout:    getEnvInt("WEBHOOK_TIMEOUT", 30),
			RetryCount: getEnvInt("WEBHOOK_RETRY_COUNT", 3),
		},
		Log: LogConfig{
			Level:  getEnv("LOG_LEVEL", "info"),
			Format: getEnv("LOG_FORMAT", "json"),
		},
	}

	// Build DATABASE_URL if not provided
	if cfg.Database.URL == "" {
		cfg.Database.URL = "postgres://" + cfg.Database.User + ":" + cfg.Database.Password +
			"@" + cfg.Database.Host + ":" + cfg.Database.Port + "/" + cfg.Database.Name + "?sslmode=disable"
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		parsed, err := strconv.ParseBool(value)
		if err == nil {
			return parsed
		}
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		parsed, err := strconv.Atoi(value)
		if err == nil {
			return parsed
		}
	}
	return defaultValue
}

