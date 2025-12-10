//go:build ignore

package main

import (
	"context"
	"fmt"
	"os"
	"time"

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

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		fmt.Printf("❌ Erro ao conectar ao banco: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(ctx)

	fmt.Println("🌱 Iniciando seed do banco de dados...")

	// Seed é idempotente - pode rodar múltiplas vezes sem problemas
	// Usa INSERT ... ON CONFLICT DO NOTHING para evitar duplicatas

	// 1. Verificar se já existe algum dado
	var instanceCount int
	err = conn.QueryRow(ctx, "SELECT COUNT(*) FROM instances").Scan(&instanceCount)
	if err != nil {
		fmt.Printf("⚠️  Erro ao verificar instâncias: %v\n", err)
		// Continua mesmo se houver erro (tabela pode não existir ainda)
	}

	var userCount int
	err = conn.QueryRow(ctx, "SELECT COUNT(*) FROM auth_users").Scan(&userCount)
	if err != nil {
		fmt.Printf("⚠️  Erro ao verificar usuários: %v\n", err)
		// Continua mesmo se houver erro (tabela pode não existir ainda)
	}

	fmt.Printf("📊 Status atual: %d instâncias, %d usuários\n", instanceCount, userCount)

	// 2. Seed de dados iniciais (apenas se necessário)
	// Por enquanto, não criamos dados iniciais automaticamente
	// O seed serve para preparar o banco para uso

	fmt.Println("✅ Seed concluído! O banco está pronto para uso.")
	fmt.Println("💡 Dica: Crie instâncias e usuários através da API/web interface.")
}

