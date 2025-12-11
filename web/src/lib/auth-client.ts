"use client";

import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, admin, developer, user } from "./permissions";

/**
 * Better Auth Client
 * Following the official Better Auth documentation pattern
 * https://www.better-auth.com/docs/installation
 */

// Get base URL - simple and direct
// If same domain, baseURL is optional, but we set it explicitly for clarity
const baseURL = 
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

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

