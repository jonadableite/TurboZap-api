//go:build ignore

package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		fmt.Println("❌ DATABASE_URL não encontrada no .env")
		os.Exit(1)
	}

	fmt.Println("🚀 Iniciando setup completo do banco de dados...")

	// Step 1: Criar banco se não existir
	if err := ensureDatabase(dbURL); err != nil {
		fmt.Printf("❌ Erro ao criar/verificar banco: %v\n", err)
		os.Exit(1)
	}

	// Step 2: Conectar ao banco
	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		fmt.Printf("❌ Erro ao conectar ao banco: %v\n", err)
		os.Exit(1)
	}
	defer pool.Close()

	// Step 3: Rodar migrations do backend Go
	fmt.Println("📦 Aplicando migrations do backend Go...")
	if err := runGoMigrations(pool); err != nil {
		fmt.Printf("❌ Erro ao aplicar migrations do Go: %v\n", err)
		os.Exit(1)
	}

	// Step 4: Rodar migrations do Better Auth (via CLI)
	// Nota: Better Auth migrations são opcionais no container Docker
	// pois o Next.js pode criar as tabelas automaticamente na primeira execução
	fmt.Println("🔐 Verificando migrations do Better Auth...")
	if err := runBetterAuthMigrations(); err != nil {
		fmt.Printf("⚠️  Aviso: Não foi possível aplicar migrations do Better Auth: %v\n", err)
		fmt.Println("💡 Isso é normal se:")
		fmt.Println("   - Node.js/npx não estiver disponível no container")
		fmt.Println("   - As tabelas já existirem")
		fmt.Println("   - O Next.js criar as tabelas automaticamente")
		// Não falha o setup se Better Auth migrations falharem
	}

	// Step 5: Rodar seed
	fmt.Println("🌱 Executando seed...")
	if err := runSeed(dbURL); err != nil {
		fmt.Printf("⚠️  Aviso: Erro ao executar seed: %v\n", err)
		// Não falha o setup se seed falhar
	}

	fmt.Println("✅ Setup do banco de dados concluído com sucesso!")
}

// ensureDatabase cria o banco se não existir
func ensureDatabase(dbURL string) error {
	config, err := pgx.ParseConfig(dbURL)
	if err != nil {
		return fmt.Errorf("erro ao parsear DATABASE_URL: %w", err)
	}

	dbName := config.Database
	if dbName == "" {
		return fmt.Errorf("nome do banco não encontrado na DATABASE_URL")
	}

	// Conectar ao banco postgres (padrão)
	config.Database = "postgres"
	connString := fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=disable",
		config.User,
		config.Password,
		config.Host,
		config.Port,
		"postgres",
	)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	conn, err := pgx.Connect(ctx, connString)
	if err != nil {
		return fmt.Errorf("erro ao conectar ao PostgreSQL: %w", err)
	}
	defer conn.Close(ctx)

	// Verificar se banco existe
	var exists bool
	err = conn.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1)", dbName).Scan(&exists)
	if err != nil {
		return fmt.Errorf("erro ao verificar banco: %w", err)
	}

	if exists {
		fmt.Printf("✅ Banco de dados '%s' já existe!\n", dbName)
	} else {
		// Criar banco
		_, err = conn.Exec(ctx, fmt.Sprintf("CREATE DATABASE %s", dbName))
		if err != nil {
			return fmt.Errorf("erro ao criar banco: %w", err)
		}
		fmt.Printf("✅ Banco de dados '%s' criado com sucesso!\n", dbName)
	}

	return nil
}

// runGoMigrations aplica as migrations do backend Go
func runGoMigrations(pool *pgxpool.Pool) error {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// Criar tabela de migrations se não existir
	_, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version INTEGER PRIMARY KEY,
			applied_at TIMESTAMP DEFAULT NOW()
		)
	`)
	if err != nil {
		return fmt.Errorf("erro ao criar tabela de migrations: %w", err)
	}

	// Migrations do backend (mesmas do postgres.go)
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
		// Verificar se migration já foi aplicada
		var count int
		err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM schema_migrations WHERE version = $1", m.version).Scan(&count)
		if err != nil {
			return fmt.Errorf("erro ao verificar migration %d: %w", m.version, err)
		}

		if count > 0 {
			fmt.Printf("  ✓ Migration %d já aplicada\n", m.version)
			continue
		}

		// Aplicar migration
		fmt.Printf("  → Aplicando migration %d...\n", m.version)
		_, err = pool.Exec(ctx, m.query)
		if err != nil {
			return fmt.Errorf("erro ao aplicar migration %d: %w", m.version, err)
		}

		// Marcar como aplicada
		_, err = pool.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ($1)", m.version)
		if err != nil {
			return fmt.Errorf("erro ao registrar migration %d: %w", m.version, err)
		}

		fmt.Printf("  ✓ Migration %d aplicada com sucesso\n", m.version)
	}

	return nil
}

// runBetterAuthMigrations executa o CLI do Better Auth para criar tabelas
func runBetterAuthMigrations() error {
	// Tentar encontrar o diretório web
	webDir := "web"
	if _, err := os.Stat(webDir); os.IsNotExist(err) {
		// Tentar caminho alternativo
		webDir = filepath.Join("..", "web")
		if _, err := os.Stat(webDir); os.IsNotExist(err) {
			return fmt.Errorf("diretório web não encontrado")
		}
	}

	// Verificar se node/npm está disponível
	if _, err := exec.LookPath("node"); err != nil {
		return fmt.Errorf("node não encontrado no PATH (Better Auth CLI requer Node.js)")
	}

	if _, err := exec.LookPath("npx"); err != nil {
		return fmt.Errorf("npx não encontrado no PATH (Better Auth CLI requer npx)")
	}

	// Executar Better Auth CLI migrate
	// Usar --yes para evitar prompts interativos
	cmd := exec.Command("npx", "--yes", "@better-auth/cli", "migrate")
	cmd.Dir = webDir
	cmd.Env = os.Environ()

	output, err := cmd.CombinedOutput()
	if err != nil {
		// Se o erro for porque as tabelas já existem, não é crítico
		outputStr := string(output)
		if len(outputStr) > 0 {
			fmt.Printf("  ℹ️  Output do Better Auth CLI: %s\n", outputStr)
		}
		// Verificar se é um erro não crítico (tabelas já existem)
		if contains(outputStr, "already exists") || contains(outputStr, "duplicate") {
			fmt.Println("  ✓ Tabelas do Better Auth já existem")
			return nil
		}
		return fmt.Errorf("erro ao executar Better Auth migrate: %w", err)
	}

	outputStr := string(output)
	if len(outputStr) > 0 {
		fmt.Printf("  ✓ Better Auth migrations: %s\n", outputStr)
	} else {
		fmt.Println("  ✓ Better Auth migrations aplicadas")
	}

	return nil
}

// contains verifica se uma string contém outra (case-insensitive)
func contains(s, substr string) bool {
	if len(s) < len(substr) {
		return false
	}
	sLower := toLower(s)
	substrLower := toLower(substr)
	for i := 0; i <= len(sLower)-len(substrLower); i++ {
		if sLower[i:i+len(substrLower)] == substrLower {
			return true
		}
	}
	return false
}

// toLower converte string para lowercase (simples, sem usar strings package)
func toLower(s string) string {
	result := make([]byte, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c >= 'A' && c <= 'Z' {
			result[i] = c + 32
		} else {
			result[i] = c
		}
	}
	return string(result)
}

// runSeed executa o script de seed
func runSeed(dbURL string) error {
	// Compilar e executar seed.go
	seedPath := filepath.Join("scripts", "seed.go")
	if _, err := os.Stat(seedPath); os.IsNotExist(err) {
		return fmt.Errorf("arquivo seed.go não encontrado")
	}

	// Executar seed via go run
	cmd := exec.Command("go", "run", seedPath)
	cmd.Env = os.Environ()
	cmd.Env = append(cmd.Env, fmt.Sprintf("DATABASE_URL=%s", dbURL))

	output, err := cmd.CombinedOutput()
	if err != nil {
		if len(output) > 0 {
			fmt.Printf("  ℹ️  Output do seed: %s\n", string(output))
		}
		return fmt.Errorf("erro ao executar seed: %w", err)
	}

	if len(output) > 0 {
		fmt.Printf("  %s", string(output))
	}

	return nil
}

// Migrations (copiadas do postgres.go)
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

