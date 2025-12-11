import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin } from "better-auth/plugins";
import { Pool } from "pg";
import { BETTER_AUTH_SECRET, BETTER_AUTH_URL, DATABASE_URL } from "./env";
import { ac, admin, developer, user } from "./permissions";

/**
 * Better Auth configuration
 * Tables use 'auth_' prefix to avoid conflicts with TurboZap backend tables
 * 
 * Following the official Better Auth documentation pattern:
 * https://www.better-auth.com/docs/installation
 */

// Check if we're in build phase
const isBuildPhase = 
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-development";

// Create PostgreSQL Pool - simple and direct as per Better Auth docs
// During build, create a dummy pool to avoid errors
let pool: Pool | undefined;

if (isBuildPhase || !DATABASE_URL || DATABASE_URL.trim() === "") {
  // Build phase or no DATABASE_URL: create dummy pool
  pool = new Pool({
    connectionString: "postgres://dummy:dummy@localhost:5432/dummy",
  });
} else {
  // Runtime: create real pool exactly as Better Auth documentation shows
  pool = new Pool({
    connectionString: DATABASE_URL,
  });

  // Handle pool errors
  pool.on("error", (err) => {
    console.error("[Auth] Unexpected error on idle PostgreSQL client:", err);
  });
}

// Create auth instance - following Better Auth documentation pattern
export const auth = betterAuth({
  // Database - pass Pool directly as shown in docs
  database: pool,

  // App configuration
  appName: "TurboZap",
  secret: BETTER_AUTH_SECRET || "dummy-secret-for-build-time-only",
  baseURL: BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",

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
      sendChangeEmailVerification: async ({ user, newEmail, url }: { user: { email: string }; newEmail: string; url: string }) => {
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
    cookiePrefix: "turbozap",
    useSecureCookies: process.env.NODE_ENV === "production",
    // Cookie settings for production
    sameSite: "lax", // Allow cookies to work with redirects
    // Ensure cookies work across subdomains if needed
    cookieDomain: process.env.NODE_ENV === "production" 
      ? process.env.COOKIE_DOMAIN || undefined 
      : undefined,
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
      defaultRole: "USER",
      // Abrange variações de role em caixa alta/baixa e permite DEVELOPER como admin também
      adminRoles: ["ADMIN", "admin", "DEVELOPER", "developer"],
      // Permite liberar admins explícitos via env (lista separada por vírgula) + fallback do ID informado
      adminUserIds: [
        "siJWuJKZOb90SnEyWkU3tlptDxJyIPpP", // Jonadab (admin informado)
        ...(process.env.ADMIN_USER_IDS?.split(",")
          .map((id) => id.trim())
          .filter(Boolean) || []),
      ],
    }),
    nextCookies(), // Must be last
  ],
});

// Export types for use in the application
export type User = typeof auth.$Infer.Session.user & {
  role?: string;
  banned?: boolean;
  banReason?: string | null;
  banExpires?: Date | null;
};

export type Session = Omit<typeof auth.$Infer.Session, 'user'> & {
  user: User;
};
