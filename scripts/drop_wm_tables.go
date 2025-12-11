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

	conn, err := pgx.Connect(context.Background(), dbURL)
	if err != nil {
		fmt.Printf("Erro ao conectar: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(context.Background())

	tables := []string{
		"whatsmeow_device",
		"whatsmeow_identity_keys",
		"whatsmeow_pre_keys",
		"whatsmeow_sessions",
		"whatsmeow_sender_keys",
		"whatsmeow_app_state_sync_keys",
		"whatsmeow_app_state_version",
		"whatsmeow_app_state_mutation_macs",
		"whatsmeow_contacts",
		"whatsmeow_chat_settings",
	}

	fmt.Println("🧹 Limpando tabelas do WhatsApp para corrigir inicialização...")
	for _, table := range tables {
		_, err := conn.Exec(context.Background(), fmt.Sprintf("DROP TABLE IF EXISTS %s CASCADE", table))
		if err != nil {
			fmt.Printf("❌ Erro ao remover %s: %v\n", table, err)
		} else {
			// fmt.Printf("✓ %s removida\n", table)
		}
	}
	fmt.Println("✅ Limpeza concluída! Agora a API pode criar as tabelas automaticamente.")
}
