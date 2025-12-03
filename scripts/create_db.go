//go:build ignore

package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5"
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

	// Parse URL to get connection without database name
	config, err := pgx.ParseConfig(dbURL)
	if err != nil {
		fmt.Printf("❌ Erro ao parsear DATABASE_URL: %v\n", err)
		os.Exit(1)
	}

	// Connect to postgres database (default)
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
	err = conn.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1)", "turbozap").Scan(&exists)
	if err != nil {
		fmt.Printf("❌ Erro ao verificar banco: %v\n", err)
		os.Exit(1)
	}

	if exists {
		fmt.Println("✅ Banco de dados 'turbozap' já existe!")
	} else {
		// Create database
		_, err = conn.Exec(ctx, "CREATE DATABASE turbozap")
		if err != nil {
			fmt.Printf("❌ Erro ao criar banco: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("✅ Banco de dados 'turbozap' criado com sucesso!")
	}
}
