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

// Validate DATABASE_URL
if (!DATABASE_URL || typeof DATABASE_URL !== "string") {
  throw new Error(
    "DATABASE_URL is required. Please set it in your environment variables."
  );
}

// Log database connection info (without sensitive data)
if (process.env.NODE_ENV === "development") {
  try {
    const dbUrl = new URL(DATABASE_URL);
    console.log("[Auth] Database:", {
      host: dbUrl.hostname,
      port: dbUrl.port || "5432",
      database: dbUrl.pathname.slice(1) || "turbozap",
      ssl: dbUrl.searchParams.get("sslmode") !== "disable",
    });
  } catch (err) {
    console.warn("[Auth] Could not parse DATABASE_URL:", err);
    console.log("[Auth] DATABASE_URL format:", DATABASE_URL.substring(0, 20) + "...");
  }
}

// Create PostgreSQL Pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  // Add connection pool options for better reliability
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("[Auth] Unexpected error on idle PostgreSQL client", err);
});

// Test connection in development
if (process.env.NODE_ENV === "development") {
  pool
    .query("SELECT NOW()")
    .then(() => {
      console.log("[Auth] Database connection successful");
    })
    .catch((err) => {
      console.error("[Auth] Database connection failed:", err.message);
    });
}

export const auth = betterAuth({
  database: pool,

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
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_API_URL,
  ].filter((origin): origin is string => Boolean(origin)), // Remove undefined/null values and ensure type safety
});

// Export types for use in the application
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
