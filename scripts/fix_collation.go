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

	fmt.Println("🔄 Tentando corrigir collation do template1...")
	_, err = conn.Exec(ctx, "ALTER DATABASE template1 REFRESH COLLATION VERSION")
	if err != nil {
		fmt.Printf("⚠️ Erro ao corrigir template1 (pode ser normal se não for superuser ou versão antiga): %v\n", err)
	} else {
		fmt.Println("✅ Collation do template1 corrigida!")
	}

	fmt.Println("🔄 Tentando corrigir collation do postgres...")
	_, err = conn.Exec(ctx, "ALTER DATABASE postgres REFRESH COLLATION VERSION")
	if err != nil {
		fmt.Printf("⚠️ Erro ao corrigir postgres: %v\n", err)
	} else {
		fmt.Println("✅ Collation do postgres corrigida!")
	}
}
