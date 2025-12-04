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
-- whatsmeow session store tables
CREATE TABLE IF NOT EXISTS whatsmeow_device (
	jid TEXT PRIMARY KEY,
	registration_id BIGINT NOT NULL,
	noise_key BYTEA NOT NULL,
	identity_key BYTEA NOT NULL,
	signed_pre_key BYTEA NOT NULL,
	signed_pre_key_id INTEGER NOT NULL,
	signed_pre_key_sig BYTEA NOT NULL,
	adv_key BYTEA NOT NULL,
	adv_details BYTEA NOT NULL,
	adv_account_sig BYTEA NOT NULL,
	adv_device_sig BYTEA NOT NULL,
	platform TEXT NOT NULL DEFAULT '',
	business_name TEXT NOT NULL DEFAULT '',
	push_name TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS whatsmeow_identity_keys (
	our_jid TEXT NOT NULL,
	their_id TEXT NOT NULL,
	identity BYTEA NOT NULL,
	PRIMARY KEY (our_jid, their_id)
);

CREATE TABLE IF NOT EXISTS whatsmeow_pre_keys (
	jid TEXT NOT NULL,
	key_id INTEGER NOT NULL,
	key BYTEA NOT NULL,
	uploaded BOOLEAN NOT NULL DEFAULT false,
	PRIMARY KEY (jid, key_id)
);

CREATE TABLE IF NOT EXISTS whatsmeow_sessions (
	our_jid TEXT NOT NULL,
	their_id TEXT NOT NULL,
	session BYTEA NOT NULL,
	PRIMARY KEY (our_jid, their_id)
);

CREATE TABLE IF NOT EXISTS whatsmeow_sender_keys (
	our_jid TEXT NOT NULL,
	chat_id TEXT NOT NULL,
	sender_id TEXT NOT NULL,
	sender_key BYTEA NOT NULL,
	PRIMARY KEY (our_jid, chat_id, sender_id)
);

CREATE TABLE IF NOT EXISTS whatsmeow_app_state_sync_keys (
	jid TEXT NOT NULL,
	key_id BYTEA NOT NULL,
	key_data BYTEA NOT NULL,
	timestamp BIGINT NOT NULL,
	fingerprint BYTEA NOT NULL,
	PRIMARY KEY (jid, key_id)
);

CREATE TABLE IF NOT EXISTS whatsmeow_app_state_version (
	jid TEXT NOT NULL,
	name TEXT NOT NULL,
	version BIGINT NOT NULL,
	hash BYTEA NOT NULL,
	PRIMARY KEY (jid, name)
);

CREATE TABLE IF NOT EXISTS whatsmeow_app_state_mutation_macs (
	jid TEXT NOT NULL,
	name TEXT NOT NULL,
	version BIGINT NOT NULL,
	index_mac BYTEA NOT NULL,
	value_mac BYTEA NOT NULL,
	PRIMARY KEY (jid, name, version, index_mac)
);

CREATE TABLE IF NOT EXISTS whatsmeow_contacts (
	our_jid TEXT NOT NULL,
	their_jid TEXT NOT NULL,
	first_name TEXT NOT NULL DEFAULT '',
	full_name TEXT NOT NULL DEFAULT '',
	push_name TEXT NOT NULL DEFAULT '',
	business_name TEXT NOT NULL DEFAULT '',
	PRIMARY KEY (our_jid, their_jid)
);

CREATE TABLE IF NOT EXISTS whatsmeow_chat_settings (
	our_jid TEXT NOT NULL,
	chat_jid TEXT NOT NULL,
	muted_until BIGINT NOT NULL DEFAULT 0,
	pinned BOOLEAN NOT NULL DEFAULT false,
	archived BOOLEAN NOT NULL DEFAULT false,
	PRIMARY KEY (our_jid, chat_jid)
);
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
