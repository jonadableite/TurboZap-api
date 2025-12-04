package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the application
type Config struct {
	App      AppConfig
	Server   ServerConfig
	Database DatabaseConfig
	WhatsApp WhatsAppConfig
	Webhook  WebhookConfig
	Log      LogConfig
	RabbitMQ RabbitMQConfig
	Redis    RedisConfig
	MinIO    MinIOConfig
}

// AppConfig holds general application metadata
type AppConfig struct {
	Name    string
	Version string
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
	Timeout               int
	RetryCount            int
	GlobalEnabled         bool
	GlobalURL             string
	GlobalWebhookByEvents bool
	GlobalBase64          bool
	GlobalEvents          map[string]bool
}

// LogConfig holds logging-related configuration
type LogConfig struct {
	Level  string
	Format string
}

// RabbitMQConfig holds RabbitMQ-related configuration
type RabbitMQConfig struct {
	URL            string
	Exchange       string
	QueuePrefix    string
	WorkerCount    int
	PrefetchCount  int
	ReconnectDelay int
	MaxRetries     int
}

// RedisConfig holds Redis-related configuration
type RedisConfig struct {
	URL          string
	Password     string
	DB           int
	MaxRetries   int
	PoolSize     int
	RateLimitRPM int // Rate limit requests per minute
}

// MinIOConfig holds MinIO-related configuration
type MinIOConfig struct {
	Endpoint        string
	AccessKeyID     string
	SecretAccessKey string
	BucketName      string
	UseSSL          bool
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	// Load .env file if it exists
	_ = godotenv.Load()

	cfg := &Config{
		App: AppConfig{
			Name:    getEnv("APP_NAME", "TurboZap API"),
			Version: getEnv("APP_VERSION", "dev"),
		},
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
			Timeout:               getEnvInt("WEBHOOK_TIMEOUT", 30),
			RetryCount:            getEnvInt("WEBHOOK_RETRY_COUNT", 3),
			GlobalEnabled:         getEnvBool("WEBHOOK_GLOBAL_ENABLED", false),
			GlobalURL:             getEnv("WEBHOOK_GLOBAL_URL", ""),
			GlobalWebhookByEvents: getEnvBool("WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS", false),
			GlobalBase64:          getEnvBool("WEBHOOK_GLOBAL_BASE64", false),
			GlobalEvents:          loadWebhookEventToggles(),
		},
		Log: LogConfig{
			Level:  getEnv("LOG_LEVEL", "info"),
			Format: getEnv("LOG_FORMAT", "json"),
		},
		RabbitMQ: RabbitMQConfig{
			URL:            getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
			Exchange:       getEnv("RABBITMQ_EXCHANGE", "whatsapp.events"),
			QueuePrefix:    getEnv("RABBITMQ_QUEUE_PREFIX", "whatsapp"),
			WorkerCount:    getEnvInt("RABBITMQ_WORKER_COUNT", 2),
			PrefetchCount:  getEnvInt("RABBITMQ_PREFETCH_COUNT", 10),
			ReconnectDelay: getEnvInt("RABBITMQ_RECONNECT_DELAY", 5),
			MaxRetries:     getEnvInt("RABBITMQ_MAX_RETRIES", 3),
		},
		Redis: RedisConfig{
			URL:          getEnv("REDIS_URL", "redis://localhost:6379"),
			Password:     getEnv("REDIS_PASSWORD", ""),
			DB:           getEnvInt("REDIS_DB", 0),
			MaxRetries:   getEnvInt("REDIS_MAX_RETRIES", 3),
			PoolSize:     getEnvInt("REDIS_POOL_SIZE", 10),
			RateLimitRPM: getEnvInt("REDIS_RATE_LIMIT_RPM", 60),
		},
		MinIO: MinIOConfig{
			Endpoint:        getEnv("MINIO_ENDPOINT", "localhost:9000"),
			AccessKeyID:     getEnv("MINIO_ACCESS_KEY", "minioadmin"),
			SecretAccessKey: getEnv("MINIO_SECRET_KEY", "minioadmin"),
			BucketName:      getEnv("MINIO_BUCKET", "turbozap-media"),
			UseSSL:          getEnvBool("MINIO_USE_SSL", false),
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

func loadWebhookEventToggles() map[string]bool {
	toggles := make(map[string]bool)

	const prefix = "WEBHOOK_EVENTS_"
	for _, entry := range os.Environ() {
		if !strings.HasPrefix(entry, prefix) {
			continue
		}

		parts := strings.SplitN(entry, "=", 2)
		if len(parts) != 2 {
			continue
		}

		envKey := strings.TrimPrefix(parts[0], prefix)
		enabled, err := strconv.ParseBool(parts[1])
		if err != nil {
			continue
		}

		slug := slugFromWebhookEnvKey(envKey)
		if slug == "" {
			continue
		}
		toggles[slug] = enabled
	}
	return toggles
}

func slugFromWebhookEnvKey(key string) string {
	key = strings.TrimSpace(key)
	if key == "" {
		return ""
	}

	slug := strings.ToLower(key)
	slug = strings.ReplaceAll(slug, "__", "_")
	slug = strings.ReplaceAll(slug, "_", "-")
	return slug
}
