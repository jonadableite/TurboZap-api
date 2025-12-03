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
	"go.uber.org/zap"
)

func main() {
	// Initialize logger
	logger, err := initLogger()
	if err != nil {
		fmt.Printf("Failed to initialize logger: %v\n", err)
		os.Exit(1)
	}
	defer logger.Sync()

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("Failed to load configuration", zap.Error(err))
	}

	logger.Info("Starting TurboZap API",
		zap.String("host", cfg.Server.Host),
		zap.String("port", cfg.Server.Port),
	)

	// Initialize database
	db, err := database.NewPostgresConnection(cfg.Database.URL)
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	// Run migrations
	if err := database.RunMigrations(db); err != nil {
		logger.Fatal("Failed to run migrations", zap.Error(err))
	}

	// Initialize repositories
	instanceRepo := repository.NewInstancePostgresRepository(db)
	webhookRepo := repository.NewWebhookPostgresRepository(db)

	// Initialize webhook dispatcher
	webhookDispatcher := webhook.NewDispatcher(cfg.Webhook, logger)
	webhookDispatcher.SetWebhookRepository(webhookRepo)

	// Initialize WhatsApp manager
	waManager := whatsapp.NewManager(cfg, db, logger, webhookDispatcher)

	// Restore existing instances
	ctx := context.Background()
	if err := waManager.RestoreInstances(ctx, instanceRepo); err != nil {
		logger.Warn("Failed to restore some instances", zap.Error(err))
	}

	// Initialize HTTP router
	router := http.NewRouter(cfg, logger, instanceRepo, webhookRepo, waManager)

	// Start server in goroutine
	go func() {
		addr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
		if err := router.Listen(addr); err != nil {
			logger.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	logger.Info("TurboZap API started successfully",
		zap.String("address", fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)),
	)

	// Wait for shutdown signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down TurboZap API...")

	// Graceful shutdown
	waManager.DisconnectAll()
	router.Shutdown()

	logger.Info("TurboZap API stopped")
}

func initLogger() (*zap.Logger, error) {
	env := os.Getenv("ENVIRONMENT")
	if env == "production" {
		return zap.NewProduction()
	}
	return zap.NewDevelopment()
}
