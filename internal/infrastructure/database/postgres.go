package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// NewPostgresConnection creates a new PostgreSQL connection pool
func NewPostgresConnection(databaseURL string) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}

	// Configure connection pool
	config.MaxConns = 25
	config.MinConns = 5
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute
	config.HealthCheckPeriod = time.Minute

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Test connection
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return pool, nil
}

// RunMigrations runs all database migrations
func RunMigrations(pool *pgxpool.Pool) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Create migrations table if not exists
	_, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version INTEGER PRIMARY KEY,
			applied_at TIMESTAMP DEFAULT NOW()
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Run migrations in order
	migrations := []struct {
		version int
		query   string
	}{
		{1, migrationV1CreateInstances},
		{2, migrationV2CreateWebhooks},
		{3, migrationV3CreateMessages},
		{4, migrationV4WhatsmeowTables},
		{5, migrationV5AddDeviceJID},
		{6, migrationV6AddWebhookOptions},
		{7, migrationV7InitAuth},
	}

	for _, m := range migrations {
		// Check if migration already applied
		var count int
		err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM schema_migrations WHERE version = $1", m.version).Scan(&count)
		if err != nil {
			return fmt.Errorf("failed to check migration %d: %w", m.version, err)
		}

		if count > 0 {
			continue // Already applied
		}

		// Apply migration
		_, err = pool.Exec(ctx, m.query)
		if err != nil {
			return fmt.Errorf("failed to apply migration %d: %w", m.version, err)
		}

		// Mark as applied
		_, err = pool.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ($1)", m.version)
		if err != nil {
			return fmt.Errorf("failed to record migration %d: %w", m.version, err)
		}
	}

	return nil
}

const migrationV1CreateInstances = `
CREATE TABLE IF NOT EXISTS instances (
	id UUID PRIMARY KEY,
	name VARCHAR(100) UNIQUE NOT NULL,
	api_key VARCHAR(100) UNIQUE NOT NULL,
	status VARCHAR(20) DEFAULT 'disconnected',
	phone_number VARCHAR(20),
	profile_name VARCHAR(255),
	profile_pic TEXT,
	qr_code TEXT,
	created_at TIMESTAMP DEFAULT NOW(),
	updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instances_name ON instances(name);
CREATE INDEX IF NOT EXISTS idx_instances_api_key ON instances(api_key);
CREATE INDEX IF NOT EXISTS idx_instances_status ON instances(status);
`

const migrationV2CreateWebhooks = `
CREATE TABLE IF NOT EXISTS webhooks (
	id UUID PRIMARY KEY,
	instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
	url TEXT NOT NULL,
	events TEXT[] DEFAULT '{}',
	headers JSONB DEFAULT '{}',
	enabled BOOLEAN DEFAULT true,
	created_at TIMESTAMP DEFAULT NOW(),
	updated_at TIMESTAMP DEFAULT NOW(),
	UNIQUE(instance_id)
);

CREATE INDEX IF NOT EXISTS idx_webhooks_instance_id ON webhooks(instance_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_enabled ON webhooks(enabled);
`

const migrationV3CreateMessages = `
CREATE TABLE IF NOT EXISTS messages (
	id UUID PRIMARY KEY,
	instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
	message_id VARCHAR(100),
	remote_jid VARCHAR(100) NOT NULL,
	from_me BOOLEAN DEFAULT false,
	type VARCHAR(20) NOT NULL,
	status VARCHAR(20) DEFAULT 'pending',
	content TEXT,
	media_url TEXT,
	media_mime_type VARCHAR(100),
	media_caption TEXT,
	quoted_msg_id VARCHAR(100),
	timestamp TIMESTAMP NOT NULL,
	created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_instance_id ON messages(instance_id);
CREATE INDEX IF NOT EXISTS idx_messages_message_id ON messages(instance_id, message_id);
CREATE INDEX IF NOT EXISTS idx_messages_remote_jid ON messages(instance_id, remote_jid);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
`

const migrationV4WhatsmeowTables = `
-- whatsmeow tables are now managed by the library itself directly
-- This migration is kept empty to preserve version numbering history
SELECT 1;
`

const migrationV5AddDeviceJID = `
-- Add device_jid column to instances table for session persistence
ALTER TABLE instances 
ADD COLUMN IF NOT EXISTS device_jid TEXT;

CREATE INDEX IF NOT EXISTS idx_instances_device_jid ON instances(device_jid) WHERE device_jid IS NOT NULL;
`

const migrationV6AddWebhookOptions = `
ALTER TABLE webhooks
ADD COLUMN IF NOT EXISTS webhook_by_events BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS webhook_base64 BOOLEAN DEFAULT false;
`

const migrationV7InitAuth = `
-- ==========================================
-- Better-Auth Migration
-- This migration only creates auth tables and adds user_id to instances
-- It does NOT modify existing TurboZap tables
-- ==========================================

-- CreateEnum: Role
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('USER', 'DEVELOPER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- Create Auth Tables (only if they don't exist)
-- ==========================================

-- auth_users
CREATE TABLE IF NOT EXISTS "auth_users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_users_pkey" PRIMARY KEY ("id")
);

-- auth_sessions
CREATE TABLE IF NOT EXISTS "auth_sessions" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "impersonatedBy" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- auth_accounts
CREATE TABLE IF NOT EXISTS "auth_accounts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id")
);

-- auth_verifications
CREATE TABLE IF NOT EXISTS "auth_verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_verifications_pkey" PRIMARY KEY ("id")
);

-- api_keys
CREATE TABLE IF NOT EXISTS "api_keys" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "user_id" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- activity_logs
CREATE TABLE IF NOT EXISTS "activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" VARCHAR(50) NOT NULL,
    "resource" VARCHAR(50) NOT NULL,
    "resource_id" TEXT,
    "details" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- ==========================================
-- Create Indexes (only if they don't exist)
-- ==========================================

-- auth_users indexes
CREATE UNIQUE INDEX IF NOT EXISTS "auth_users_email_key" ON "auth_users"("email");

-- auth_sessions indexes
CREATE UNIQUE INDEX IF NOT EXISTS "auth_sessions_token_key" ON "auth_sessions"("token");
CREATE INDEX IF NOT EXISTS "auth_sessions_userId_idx" ON "auth_sessions"("userId");

-- auth_accounts indexes
CREATE INDEX IF NOT EXISTS "auth_accounts_userId_idx" ON "auth_accounts"("userId");

-- api_keys indexes
CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_key_key" ON "api_keys"("key");
CREATE INDEX IF NOT EXISTS "api_keys_user_id_idx" ON "api_keys"("user_id");
CREATE INDEX IF NOT EXISTS "api_keys_key_idx" ON "api_keys"("key");

-- activity_logs indexes
CREATE INDEX IF NOT EXISTS "activity_logs_user_id_idx" ON "activity_logs"("user_id");
CREATE INDEX IF NOT EXISTS "activity_logs_action_idx" ON "activity_logs"("action");
CREATE INDEX IF NOT EXISTS "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- ==========================================
-- Add Foreign Keys (only if they don't exist)
-- ==========================================

-- auth_sessions -> auth_users
DO $$ BEGIN
    ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- auth_accounts -> auth_users
DO $$ BEGIN
    ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- Add user_id column to instances table
-- ==========================================

-- Add user_id column if it doesn't exist
ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "user_id" TEXT;

-- Create index for user_id if it doesn't exist
CREATE INDEX IF NOT EXISTS "idx_instances_user_id" ON "instances"("user_id");

-- Add foreign key from instances to auth_users (SET NULL on delete to preserve instance data)
DO $$ BEGIN
    ALTER TABLE "instances" ADD CONSTRAINT "instances_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
`
