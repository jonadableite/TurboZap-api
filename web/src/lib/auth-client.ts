"use client";

import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, admin, developer, user } from "./permissions";

/**
 * Better Auth Client
 * Used in React components for authentication
 */
const getBaseURL = (): string => {
  // Check if we're in build phase
  const isBuildPhase = 
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-development";

  if (typeof window !== "undefined") {
    // Client-side: use env var or fallback to current origin
    const url =
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      window.location.origin;
    if (process.env.NODE_ENV === "development") {
      console.log("[AuthClient] Base URL:", url);
    }
    return url;
  }
  // Server-side: use env var (required in production, but allow empty during build)
  const url =
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL;
  
  // During build, allow empty URL (will be set at runtime)
  if (!url && !isBuildPhase && process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_BETTER_AUTH_URL or NEXT_PUBLIC_APP_URL must be set in production. " +
      "Please set it in your .env file."
    );
  }
  
  // In development or build, default to localhost if not set
  return url || "http://localhost:3000";
};

// Create auth client with a stable baseURL
const baseURL = getBaseURL();

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    adminClient({
      ac,
      roles: {
        admin,
        developer,
        user,
      },
    }),
  ],
});

// Export commonly used hooks and methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

// Type exports
export type AuthSession = typeof authClient.$Infer.Session;
export type AuthUser = typeof authClient.$Infer.Session.user;

