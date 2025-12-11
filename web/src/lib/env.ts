/**
 * Environment variables for server-side code
 * Next.js automatically loads .env.local
 * 
 * IMPORTANT: All sensitive data must come from .env file
 * Never hardcode secrets, passwords, or production URLs in the code
 * 
 * NOTE: During build time, some variables may not be available.
 * Validation is deferred to runtime when the values are actually used.
 */

function getRequiredEnv(key: string, description?: string): string {
  const value = process.env[key];
  // During build time, allow missing values to prevent build errors
  // They will be validated at runtime when actually used
  const isBuildTime = 
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-development" ||
    !process.env.NODE_ENV ||
    process.env.NODE_ENV === "test";
  
  if (!value && !isBuildTime) {
    throw new Error(
      `Missing required environment variable: ${key}${description ? ` (${description})` : ""}. ` +
      `Please set it in your .env file.`
    );
  }
  // Return empty string during build to avoid errors, will be validated at runtime
  return value || "";
}

function getOptionalEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

/**
 * Database connection string for PostgreSQL
 * Format: postgres://user:password@host:port/database?sslmode=disable
 * 
 * NOTE: During build, this may be empty. Validation happens at runtime.
 */
export const DATABASE_URL = getRequiredEnv(
  "DATABASE_URL",
  "PostgreSQL connection string"
);

/**
 * Better Auth secret key for signing tokens
 * Generate a secure random string (min 32 characters)
 * 
 * NOTE: During build, this may be empty. Validation happens at runtime.
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
    : getOptionalEnv("BETTER_AUTH_URL") || "");

