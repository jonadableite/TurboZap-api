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

// Check if we're in build phase
const isBuildPhase = 
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-development";

// Validate DATABASE_URL only at runtime (not during build)
// During build, DATABASE_URL may be empty, which is acceptable
if (typeof window === "undefined" && !isBuildPhase) {
  if (!DATABASE_URL || typeof DATABASE_URL !== "string" || DATABASE_URL.trim() === "") {
    throw new Error(
      "DATABASE_URL is required. Please set it in your environment variables."
    );
  }
}

// Create PostgreSQL Pool - ensure it's created at runtime
// During build time, skip pool creation
let pool: Pool | null = null;

// Function to initialize pool (called at runtime)
function initializePool() {
  // If pool already exists, return it
  if (pool) {
    return pool;
  }

  // Check if we're in build phase
  if (isBuildPhase) {
    return null;
  }

  // Validate DATABASE_URL
  if (!DATABASE_URL || DATABASE_URL.trim() === "") {
    console.error("[Auth] DATABASE_URL is not set. Cannot create database pool.");
    return null;
  }

  try {
    // Log database connection info (without sensitive data)
    try {
      const dbUrl = new URL(DATABASE_URL);
      console.log("[Auth] Initializing database pool:", {
        host: dbUrl.hostname,
        port: dbUrl.port || "5432",
        database: dbUrl.pathname.slice(1) || "turbozap",
        ssl: dbUrl.searchParams.get("sslmode") !== "disable",
      });
    } catch (err) {
      console.warn("[Auth] Could not parse DATABASE_URL:", err);
    }

    // Create PostgreSQL Pool
    pool = new Pool({
      connectionString: DATABASE_URL,
      // Add connection pool options for better reliability
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 5000, // Increased to 5 seconds for production
    });

    // Handle pool errors
    pool.on("error", (err) => {
      console.error("[Auth] Unexpected error on idle PostgreSQL client", err);
    });

    // Test connection
    pool
      .query("SELECT NOW()")
      .then(() => {
        console.log("[Auth] Database connection successful");
      })
      .catch((err) => {
        console.error("[Auth] Database connection failed:", err.message);
      });

    return pool;
  } catch (err) {
    console.error("[Auth] Failed to create database pool:", err);
    return null;
  }
}

// Initialize pool immediately if not in build phase
if (!isBuildPhase) {
  initializePool();
}

// Get or create pool for auth (lazy initialization)
function getAuthPool() {
  if (isBuildPhase) {
    return undefined;
  }
  // Ensure pool is initialized
  if (!pool) {
    const initializedPool = initializePool();
    return initializedPool || undefined;
  }
  return pool;
}

// Only create auth instance if we have required values (not during build)
// During build, create a minimal config that won't be used
const authConfig = {
  database: getAuthPool(),

  // App configuration
  appName: "TurboZap",
  secret: BETTER_AUTH_SECRET || "dummy-secret-for-build-time-only",
  baseURL: BETTER_AUTH_URL || "http://localhost:3000",

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
    BETTER_AUTH_URL,
  ].filter((origin): origin is string => Boolean(origin)), // Remove undefined/null values and ensure type safety
};

// Type assertion needed due to build-time config variations and Better Auth type complexity
// During build, some values may be empty strings, but Better Auth will handle this at runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth = betterAuth(authConfig as any);

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
