/**
 * Environment variables for server-side code
 * Next.js automatically loads .env.local, but we provide fallbacks
 */

// Use the production database URL as fallback
const PRODUCTION_DATABASE_URL =
  "postgres://postgres:c4102143751b6e25d238@painel.whatlead.com.br:5436/turbozap?sslmode=disable";

export const DATABASE_URL = process.env.DATABASE_URL || PRODUCTION_DATABASE_URL;

export const BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ||
  process.env.NEXT_PUBLIC_BETTER_AUTH_SECRET ||
  "u2wvu0sToaYXp5L2eVkxnGyNXJSYwwsP";

export const BETTER_AUTH_URL =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
  "https://zap.whatlead.com.br";

