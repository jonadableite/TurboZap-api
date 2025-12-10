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
	_ = godotenv.Load()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		fmt.Println("DATABASE_URL não encontrada, usando padrão localhost...")
		dbURL = "postgres://postgres:postgres@localhost:5432/turbozap?sslmode=disable"
	}

	fmt.Println("Conectando ao banco para resetar migrações...")
	conn, err := pgx.Connect(context.Background(), dbURL)
	if err != nil {
		fmt.Printf("Erro ao conectar: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(context.Background())

	fmt.Println("Removendo tabela de controle de migrações (schema_migrations)...")
	_, err = conn.Exec(context.Background(), "DROP TABLE IF EXISTS schema_migrations")
	if err != nil {
		fmt.Printf("Erro ao dropar tabela: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✅ Tabela removida. O sistema agora vai recriar todas as tabelas faltantes.")
}
