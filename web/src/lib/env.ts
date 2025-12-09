/**
 * Environment variables for server-side code
 * Next.js automatically loads .env.local
 * 
 * IMPORTANT: All sensitive data must come from .env file
 * Never hardcode secrets, passwords, or production URLs in the code
 */

function getRequiredEnv(key: string, description?: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}${description ? ` (${description})` : ""}. ` +
      `Please set it in your .env file.`
    );
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

/**
 * Database connection string for PostgreSQL
 * Format: postgres://user:password@host:port/database?sslmode=disable
 */
export const DATABASE_URL = getRequiredEnv(
  "DATABASE_URL",
  "PostgreSQL connection string"
);

/**
 * Better Auth secret key for signing tokens
 * Generate a secure random string (min 32 characters)
 */
export const BETTER_AUTH_SECRET = getRequiredEnv(
  "BETTER_AUTH_SECRET",
  "Better Auth secret key for token signing"
);

/**
 * Better Auth base URL
 * In development: http://localhost:3000
 * In production: your production URL (e.g., https://yourdomain.com)
 */
export const BETTER_AUTH_URL =
  getOptionalEnv("BETTER_AUTH_URL") ||
  getOptionalEnv("NEXT_PUBLIC_BETTER_AUTH_URL") ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : getRequiredEnv("BETTER_AUTH_URL", "Better Auth base URL for production"));

