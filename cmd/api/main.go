package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/jonadableite/turbozap-api/internal/infrastructure/database"
	"github.com/jonadableite/turbozap-api/internal/infrastructure/repository"
	"github.com/jonadableite/turbozap-api/internal/infrastructure/webhook"
	"github.com/jonadableite/turbozap-api/internal/infrastructure/whatsapp"
	"github.com/jonadableite/turbozap-api/internal/interface/http"
	"github.com/jonadableite/turbozap-api/pkg/config"
	"github.com/jonadableite/turbozap-api/pkg/logger"
)

func main() {
	// Load configuration first
	cfg, err := config.Load()
	if err != nil {
		fmt.Printf("Failed to load configuration: %v\n", err)
		os.Exit(1)
	}

	// Initialize enhanced logger
	loggerInstance, err := logger.NewLogger(cfg)
	if err != nil {
		fmt.Printf("Failed to initialize logger: %v\n", err)
		os.Exit(1)
	}
	defer loggerInstance.Sync()

	// Get logrus logger
	logrusLogger := loggerInstance.GetLogrus()
	appLogger := loggerInstance.WithContext("API")

	appLogger.Info("Starting TurboZap API", map[string]interface{}{
		"host":    cfg.Server.Host,
		"port":    cfg.Server.Port,
		"version": cfg.App.Version,
	})

	// Initialize database
	db, err := database.NewPostgresConnection(cfg.Database.URL)
	if err != nil {
		appLogger.Error("Failed to connect to database", err)
		os.Exit(1)
	}
	defer db.Close()

	// Run migrations
	if err := database.RunMigrations(db); err != nil {
		appLogger.Error("Failed to run migrations", err)
		os.Exit(1)
	}

	// Initialize repositories
	instanceRepo := repository.NewInstancePostgresRepository(db)
	webhookRepo := repository.NewWebhookPostgresRepository(db)

	// Initialize webhook dispatcher
	webhookDispatcher := webhook.NewDispatcher(cfg.Webhook, logrusLogger)
	webhookDispatcher.SetWebhookRepository(webhookRepo)

	// Initialize message repository
	messageRepo := repository.NewMessagePostgresRepository(db)

	// Initialize WhatsApp manager
	waManager := whatsapp.NewManager(cfg, db, logrusLogger, webhookDispatcher, instanceRepo, messageRepo)

	// Restore existing instances and auto-reconnect
	ctx := context.Background()
	appLogger.Info("Restoring WhatsApp instances from database...")
	if err := waManager.RestoreInstances(ctx); err != nil {
		appLogger.Warn("Failed to restore some instances", map[string]interface{}{
			"error": err.Error(),
		})
	}

	// Initialize HTTP router
	router := http.NewRouter(cfg, logrusLogger, db, instanceRepo, webhookRepo, waManager)

	// Start server in goroutine
	go func() {
		addr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
		if err := router.Listen(addr); err != nil {
			appLogger.Error("Failed to start server", err)
			os.Exit(1)
		}
	}()

	appLogger.Success("TurboZap API started successfully", map[string]interface{}{
		"address": fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port),
		"version": cfg.App.Version,
	})

	// Wait for shutdown signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	appLogger.Info("Shutting down TurboZap API...")

	// Graceful shutdown
	waManager.DisconnectAll()
	router.Shutdown()

	appLogger.Info("TurboZap API stopped")
}
