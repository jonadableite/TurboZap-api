//go:build ignore

package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
	"github.com/jonadableite/turbozap-api/internal/infrastructure/database"
)

func main() {
	// Load .env
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		fmt.Println("❌ DATABASE_URL não encontrada no .env")
		os.Exit(1)
	}

	// Parse URL to get connection without database name
	config, err := pgx.ParseConfig(dbURL)
	if err != nil {
		fmt.Printf("❌ Erro ao parsear DATABASE_URL: %v\n", err)
		os.Exit(1)
	}

	// Connect to postgres database (default)
	targetDB := config.Database
	config.Database = "postgres"
	connString := fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=disable",
		config.User,
		config.Password,
		config.Host,
		config.Port,
		"postgres",
	)

	ctx := context.Background()
	conn, err := pgx.Connect(ctx, connString)
	if err != nil {
		fmt.Printf("❌ Erro ao conectar ao PostgreSQL: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(ctx)

	// Check if database exists
	var exists bool
	err = conn.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1)", targetDB).Scan(&exists)
	if err != nil {
		fmt.Printf("❌ Erro ao verificar banco: %v\n", err)
		os.Exit(1)
	}

	if exists {
		fmt.Printf("✅ Banco de dados '%s' já existe!\n", targetDB)
	} else {
		// Create database
		_, err = conn.Exec(ctx, fmt.Sprintf("CREATE DATABASE %s", targetDB))
		if err != nil {
			fmt.Printf("❌ Erro ao criar banco: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("✅ Banco de dados '%s' criado com sucesso!\n", targetDB)
	}

	// Run migrations
	fmt.Println("🔄 Iniciando migrações...")
	
	// Connect to the new database
	pool, err := database.NewPostgresConnection(dbURL)
	if err != nil {
		fmt.Printf("❌ Erro ao conectar ao banco de dados '%s': %v\n", targetDB, err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := database.RunMigrations(pool); err != nil {
		fmt.Printf("❌ Erro ao executar migrações: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✅ Migrações concluídas com sucesso!")
}
