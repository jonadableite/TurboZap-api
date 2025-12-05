package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		// Ler o corpo da requisição
		body, err := io.ReadAll(r.Body)
		if err != nil {
			log.Printf("Erro ao ler body: %v", err)
			return
		}
		defer r.Body.Close()

		fmt.Println("\n🔔 WEBHOOK RECEBIDO:")
		fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
		fmt.Printf("Timestamp: %s\n", time.Now().Format(time.RFC3339))
		fmt.Printf("URL: %s\n", r.URL.String())

		// Tentar formatar o JSON bonito
		var prettyJSON map[string]interface{}
		if err := json.Unmarshal(body, &prettyJSON); err == nil {
			formatted, _ := json.MarshalIndent(prettyJSON, "", "  ")
			fmt.Printf("\n📦 Payload JSON:\n%s\n", string(formatted))
		} else {
			fmt.Printf("\n📦 Payload Raw:\n%s\n", string(body))
		}
		fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"received": true}`))
	})

	port := ":3001"
	fmt.Printf("✅ Servidor de Webhook (Go) rodando na porta %s\n", port)
	fmt.Println("   Aguardando requisições...")

	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatal(err)
	}
}
