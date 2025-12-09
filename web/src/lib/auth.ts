import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin } from "better-auth/plugins";
import { Pool } from "pg";
import { BETTER_AUTH_SECRET, BETTER_AUTH_URL, DATABASE_URL } from "./env";
import { ac, admin, developer, user } from "./permissions";

/**
 * Better Auth configuration
 * Tables use 'auth_' prefix to avoid conflicts with TurboZap backend tables
 */
export const auth = betterAuth({
  database: new Pool({
    connectionString: DATABASE_URL,
  }),

  // App configuration
  appName: "TurboZap",
  secret: BETTER_AUTH_SECRET,
  baseURL: BETTER_AUTH_URL,

  // Email and Password authentication
  emailAndPassword: {
    enabled: true,
    autoSignIn: true, // Login automático após signup (padrão é true)
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false, // Set to true in production
  },

  // User configuration
  user: {
    modelName: "auth_users", // Use prefixed table name
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: false, // Don't allow user to set this on signup
      },
      banned: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      banReason: {
        type: "string",
        required: false,
      },
      banExpires: {
        type: "date",
        required: false,
      },
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, newEmail, url }) => {
        // TODO: Implement email sending
        console.log(`[Auth] Change email verification for ${user.email} to ${newEmail}: ${url}`);
      },
    },
  },

  // Session configuration
  session: {
    modelName: "auth_sessions", // Use prefixed table name
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // Account table configuration
  account: {
    modelName: "auth_accounts", // Use prefixed table name
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },

  // Verification table configuration
  verification: {
    modelName: "auth_verifications", // Use prefixed table name
  },

  // Rate limiting
  rateLimit: {
    window: 60, // 60 seconds
    max: 10, // 10 requests per window
  },

  // Advanced settings
  advanced: {
    generateId: () => crypto.randomUUID(),
    cookiePrefix: "turbozap",
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  // Plugins
  plugins: [
    adminPlugin({
      ac,
      roles: {
        ADMIN: admin,    
        DEVELOPER: developer,
        USER: user,
      },
      defaultRole: "USER", // Deve ser maiúsculo para corresponder ao enum Role no PostgreSQL
      adminRoles: ["ADMIN"], // Deve ser maiúsculo
    }),
    nextCookies(), // Server Actions cookie handling (must be last)
  ],

  // Trusted origins for CORS
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:8080",
    process.env.BETTER_AUTH_URL || "",
  ].filter(Boolean),
});

// Export types for use in the application
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
