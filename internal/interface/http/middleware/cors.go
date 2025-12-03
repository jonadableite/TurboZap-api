package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

// CORSMiddleware creates a CORS middleware with default configuration
func CORSMiddleware() fiber.Handler {
	return cors.New(cors.Config{
		AllowOrigins:     "*",
		AllowMethods:     "GET,POST,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, X-API-Key, X-Requested-With",
		AllowCredentials: false,
		ExposeHeaders:    "Content-Length, Content-Type",
		MaxAge:           86400,
	})
}

// CORSMiddlewareWithConfig creates a CORS middleware with custom configuration
func CORSMiddlewareWithConfig(allowOrigins string, allowCredentials bool) fiber.Handler {
	return cors.New(cors.Config{
		AllowOrigins:     allowOrigins,
		AllowMethods:     "GET,POST,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, X-API-Key, X-Requested-With",
		AllowCredentials: allowCredentials,
		ExposeHeaders:    "Content-Length, Content-Type",
		MaxAge:           86400,
	})
}
