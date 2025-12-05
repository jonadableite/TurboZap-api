package http

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
	"github.com/jonadableite/turbozap-api/internal/infrastructure/whatsapp"
	"github.com/jonadableite/turbozap-api/internal/interface/http/handler"
	"github.com/jonadableite/turbozap-api/internal/interface/http/middleware"
	"github.com/jonadableite/turbozap-api/pkg/config"
	"github.com/sirupsen/logrus"
)

// NewRouter creates a new Fiber router with all routes configured
func NewRouter(
	cfg *config.Config,
	logger *logrus.Logger,
	instanceRepo repository.InstanceRepository,
	webhookRepo repository.WebhookRepository,
	waManager *whatsapp.Manager,
) *fiber.App {
	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName:       "TurboZap API",
		ServerHeader:  "TurboZap",
		CaseSensitive: true,
		StrictRouting: false,
		BodyLimit:     50 * 1024 * 1024, // 50MB for media uploads
		ErrorHandler:  errorHandler,
	})

	// Global middlewares
	app.Use(recover.New())
	app.Use(compress.New())
	app.Use(middleware.CORSMiddleware())
	app.Use(middleware.LoggerMiddleware(logger))

	// Health check (public)
	app.Get("/health", healthCheck)
	app.Get("/", info)

	// Create handlers
	instanceHandler := handler.NewInstanceHandler(instanceRepo, waManager, logger)
	messageHandler := handler.NewMessageHandler(instanceRepo, waManager, logger)
	groupHandler := handler.NewGroupHandler(instanceRepo, waManager, logger)
	contactHandler := handler.NewContactHandler(instanceRepo, waManager, logger)
	presenceHandler := handler.NewPresenceHandler(instanceRepo, waManager, logger)
	webhookHandler := handler.NewWebhookHandler(instanceRepo, webhookRepo, logger)

	// API routes (authenticated)
	api := app.Group("/api", middleware.AuthMiddleware(cfg, instanceRepo))

	// Instance routes
	instance := api.Group("/instance")
	instance.Post("/create", instanceHandler.Create)
	instance.Get("/list", instanceHandler.List)
	instance.Get("/:name", instanceHandler.Get)
	instance.Get("/:name/status", instanceHandler.GetStatus)
	instance.Get("/:name/qrcode", instanceHandler.GetQRCode)
	instance.Post("/:name/connect", instanceHandler.Connect)
	instance.Put("/:name/restart", instanceHandler.Restart)
	instance.Post("/:name/logout", instanceHandler.Logout)
	instance.Delete("/:name", instanceHandler.Delete)

	// Message routes
	message := api.Group("/message/:instance")
	message.Post("/text", messageHandler.SendText)
	message.Post("/media", messageHandler.SendMedia)
	message.Post("/audio", messageHandler.SendAudio)
	message.Post("/sticker", messageHandler.SendSticker)
	message.Post("/location", messageHandler.SendLocation)
	message.Post("/contact", messageHandler.SendContact)
	message.Post("/reaction", messageHandler.SendReaction)
	message.Post("/poll", messageHandler.SendPoll)
	message.Post("/button", messageHandler.SendButton)
	message.Post("/list", messageHandler.SendList)
	message.Post("/carousel", messageHandler.SendCarousel)
	message.Post("/story", messageHandler.SendStory)

	// Group routes
	group := api.Group("/group/:instance")
	group.Post("/create", groupHandler.CreateGroup)
	group.Get("/list", groupHandler.ListGroups)
	group.Get("/:groupId", groupHandler.GetGroupInfo)
	group.Put("/:groupId", groupHandler.UpdateGroupInfo)
	group.Put("/:groupId/participants", groupHandler.ManageParticipants)
	group.Post("/join", groupHandler.JoinGroup)
	group.Delete("/:groupId/leave", groupHandler.LeaveGroup)
	group.Get("/:groupId/invite", groupHandler.GetInviteLink)

	// Contact routes
	contact := api.Group("/contact/:instance")
	contact.Post("/check", contactHandler.CheckNumbers)
	contact.Get("/list", contactHandler.ListContacts)
	contact.Get("/:jid", contactHandler.GetContactInfo)
	contact.Get("/:jid/picture", contactHandler.GetProfilePicture)
	contact.Post("/block", contactHandler.BlockContact)
	contact.Post("/unblock", contactHandler.UnblockContact)

	// Presence routes
	presence := api.Group("/presence/:instance")
	presence.Post("/available", presenceHandler.SetAvailable)
	presence.Post("/unavailable", presenceHandler.SetUnavailable)
	presence.Post("/composing", presenceHandler.SetComposing)
	presence.Post("/recording", presenceHandler.SetRecording)
	presence.Post("/clear", presenceHandler.ClearPresence)
	presence.Post("/subscribe", presenceHandler.SubscribePresence)

	// Webhook routes
	webhook := api.Group("/webhook/:instance")
	webhook.Post("/set", webhookHandler.SetWebhook)
	webhook.Get("/", webhookHandler.GetWebhook)
	webhook.Delete("/", webhookHandler.DeleteWebhook)
	webhook.Post("/enable", webhookHandler.EnableWebhook)
	webhook.Post("/disable", webhookHandler.DisableWebhook)

	// Webhook events list (public info)
	api.Get("/webhook/events", webhookHandler.ListWebhookEvents)

	// Legacy routes (without /api prefix) for backwards compatibility and easier manual testing
	legacy := app.Group("/instance", middleware.AuthMiddleware(cfg, instanceRepo))
	legacy.Post("/create", instanceHandler.Create)
	legacy.Get("/list", instanceHandler.List)
	legacy.Get("/:name", instanceHandler.Get)
	legacy.Get("/:name/status", instanceHandler.GetStatus)
	legacy.Get("/:name/qrcode", instanceHandler.GetQRCode)
	legacy.Post("/:name/connect", instanceHandler.Connect)
	legacy.Put("/:name/restart", instanceHandler.Restart)
	legacy.Post("/:name/logout", instanceHandler.Logout)
	legacy.Delete("/:name", instanceHandler.Delete)

	// Legacy message routes (without /api prefix)
	legacyMessage := app.Group("/message/:instance", middleware.AuthMiddleware(cfg, instanceRepo))
	legacyMessage.Post("/text", messageHandler.SendText)
	legacyMessage.Post("/media", messageHandler.SendMedia)
	legacyMessage.Post("/audio", messageHandler.SendAudio)
	legacyMessage.Post("/sticker", messageHandler.SendSticker)
	legacyMessage.Post("/location", messageHandler.SendLocation)
	legacyMessage.Post("/contact", messageHandler.SendContact)
	legacyMessage.Post("/reaction", messageHandler.SendReaction)
	legacyMessage.Post("/poll", messageHandler.SendPoll)
	legacyMessage.Post("/button", messageHandler.SendButton)
	legacyMessage.Post("/list", messageHandler.SendList)
	legacyMessage.Post("/carousel", messageHandler.SendCarousel)
	legacyMessage.Post("/story", messageHandler.SendStory)

	return app
}

func healthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":  "ok",
		"service": "TurboZap API",
	})
}

func info(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"name":        "TurboZap API",
		"version":     "1.0.0",
		"description": "WhatsApp API using whatsmeow",
		"docs":        "/docs",
	})
}

func errorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}

	return c.Status(code).JSON(fiber.Map{
		"success": false,
		"error": fiber.Map{
			"message": err.Error(),
		},
	})
}
