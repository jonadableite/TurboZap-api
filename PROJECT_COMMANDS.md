# TurboZap API - Comandos do Projeto

Referência rápida de comandos para desenvolvimento, teste e deploy.

---

## 1. Desenvolvimento

### Setup Inicial
```bash
# Clonar e entrar no diretório
git clone https://github.com/jonadableite/turbozap-api.git
cd turbozap-api

# Copiar arquivo de ambiente
cp .env.example .env

# Editar configurações (ajustar DB, API_KEY, etc.)
nano .env

# Baixar dependências
go mod download
go mod tidy
```

### Executar Localmente
```bash
# Modo desenvolvimento (com hot reload - requer air)
air

# Modo simples
go run ./cmd/api

# Build e executar
go build -o turbozap ./cmd/api
./turbozap
```

### Build
```bash
# Build para sistema atual
go build -o turbozap ./cmd/api

# Build para Linux (produção)
GOOS=linux GOARCH=amd64 go build -o turbozap-linux ./cmd/api

# Build com flags de otimização
go build -ldflags="-s -w" -o turbozap ./cmd/api

# Build com informações de versão
go build -ldflags="-X main.version=1.0.0 -X main.buildDate=$(date -u +%Y-%m-%dT%H:%M:%SZ)" -o turbozap ./cmd/api
```

---

## 2. Testes

### Executar Testes
```bash
# Todos os testes
go test ./...

# Com verbose
go test ./... -v

# Pacote específico
go test ./internal/domain/entity/... -v

# Teste específico
go test ./internal/infrastructure/repository/... -run TestPostgresInstanceRepository_FindByID -v

# Com race detector
go test ./... -race

# Com timeout
go test ./... -timeout 30s
```

### Coverage
```bash
# Gerar coverage
go test ./... -coverprofile=coverage.out

# Ver coverage no terminal
go tool cover -func=coverage.out

# Gerar HTML
go tool cover -html=coverage.out -o coverage.html

# Abrir no browser (macOS)
open coverage.html
```

### Benchmarks
```bash
# Rodar benchmarks
go test ./... -bench=. -benchmem

# Benchmark específico
go test ./internal/infrastructure/whatsapp/... -bench=BenchmarkSendMessage -benchmem
```

---

## 3. Qualidade de Código

### Lint
```bash
# Instalar golangci-lint
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Rodar lint
golangci-lint run

# Com auto-fix
golangci-lint run --fix

# Arquivo específico
golangci-lint run ./internal/infrastructure/...
```

### Formatação
```bash
# Formatar código
go fmt ./...

# Alternativa com gofumpt (mais rigoroso)
go install mvdan.cc/gofumpt@latest
gofumpt -l -w .
```

### Análise Estática
```bash
# Go vet
go vet ./...

# Staticcheck
go install honnef.co/go/tools/cmd/staticcheck@latest
staticcheck ./...
```

### Segurança
```bash
# Gosec - análise de segurança
go install github.com/securego/gosec/v2/cmd/gosec@latest
gosec ./...

# Vulnerabilidades em dependências
go install golang.org/x/vuln/cmd/govulncheck@latest
govulncheck ./...
```

---

## 4. Dependências

### Gerenciamento
```bash
# Baixar dependências
go mod download

# Limpar e atualizar go.sum
go mod tidy

# Atualizar todas as dependências
go get -u ./...

# Atualizar dependência específica
go get -u github.com/gofiber/fiber/v2

# Ver dependências
go list -m all

# Verificar atualizações disponíveis
go list -u -m all
```

### Vendoring
```bash
# Criar vendor directory
go mod vendor

# Build com vendor
go build -mod=vendor ./cmd/api
```

---

## 5. Docker

### Docker Compose (Desenvolvimento)
```bash
# Subir todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Logs de serviço específico
docker-compose logs -f api
docker-compose logs -f postgres

# Parar serviços
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Docker Standalone
```bash
# Build imagem
docker build -t turbozap-api:latest .

# Rodar container
docker run -d \
  --name turbozap \
  -p 8080:8080 \
  -e DATABASE_URL="postgres://user:pass@host:5432/db" \
  -e API_KEY="your-api-key" \
  turbozap-api:latest

# Ver logs
docker logs -f turbozap

# Entrar no container
docker exec -it turbozap sh

# Parar e remover
docker stop turbozap && docker rm turbozap
```

### PostgreSQL (Docker)
```bash
# Subir apenas Postgres
docker-compose up -d postgres

# Conectar via psql
docker-compose exec postgres psql -U turbozap -d turbozap

# Dump do banco
docker-compose exec postgres pg_dump -U turbozap turbozap > backup.sql

# Restore
cat backup.sql | docker-compose exec -T postgres psql -U turbozap -d turbozap
```

---

## 6. Database

### Migrations
```bash
# Instalar golang-migrate
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# Criar migration
migrate create -ext sql -dir internal/infrastructure/database/migrations -seq create_instances_table

# Aplicar migrations
migrate -path internal/infrastructure/database/migrations -database "${DATABASE_URL}" up

# Rollback última migration
migrate -path internal/infrastructure/database/migrations -database "${DATABASE_URL}" down 1

# Rollback todas
migrate -path internal/infrastructure/database/migrations -database "${DATABASE_URL}" down

# Ver versão atual
migrate -path internal/infrastructure/database/migrations -database "${DATABASE_URL}" version
```

### Conectar ao Banco
```bash
# Via psql local
psql -h localhost -U turbozap -d turbozap

# Via Docker
docker-compose exec postgres psql -U turbozap -d turbozap

# Comandos úteis no psql
\dt          # Listar tabelas
\d+ table    # Descrever tabela
\l           # Listar databases
\q           # Sair
```

---

## 7. Geração de Código

### Mocks (mockgen)
```bash
# Instalar mockgen
go install go.uber.org/mock/mockgen@latest

# Gerar mock de interface
mockgen -source=internal/domain/repository/instance_repository.go \
        -destination=internal/mocks/instance_repository_mock.go \
        -package=mocks

# Gerar todos os mocks
go generate ./...
```

### Wire (Dependency Injection)
```bash
# Instalar wire
go install github.com/google/wire/cmd/wire@latest

# Gerar wire_gen.go
wire ./cmd/api
```

---

## 8. Performance

### Profiling
```bash
# CPU profile
go test -cpuprofile=cpu.prof -bench=. ./...

# Memory profile
go test -memprofile=mem.prof -bench=. ./...

# Visualizar com pprof
go tool pprof cpu.prof

# Gerar gráfico SVG
go tool pprof -svg cpu.prof > cpu.svg
```

### Trace
```bash
# Gerar trace
go test -trace=trace.out ./...

# Visualizar
go tool trace trace.out
```

---

## 9. Git

### Commits
```bash
# Padrão de commit
git commit -m "feat(instance): add reconnection logic"
git commit -m "fix(message): handle empty media URL"
git commit -m "docs: update API documentation"
git commit -m "refactor(handler): extract validation logic"
git commit -m "test(repository): add integration tests"

# Tipos: feat, fix, docs, style, refactor, test, chore
```

### Branches
```bash
# Feature branch
git checkout -b feature/send-carousel-message

# Bugfix branch
git checkout -b fix/qrcode-timeout

# Hotfix branch
git checkout -b hotfix/connection-crash
```

---

## 10. Ambiente

### Variáveis de Ambiente
```bash
# Exportar para sessão atual
export DATABASE_URL="postgres://user:pass@localhost:5432/turbozap"
export API_KEY="your-key"

# Carregar de arquivo
source .env

# Verificar variável
echo $DATABASE_URL
```

### Ferramentas de Desenvolvimento
```bash
# Instalar Air (hot reload)
go install github.com/air-verse/air@latest

# Iniciar com Air
air

# Criar config do Air
air init
```

---

## 11. Referência Rápida

| Tarefa | Comando |
|--------|---------|
| Build | `go build -o turbozap ./cmd/api` |
| Run | `go run ./cmd/api` |
| Test | `go test ./... -v` |
| Lint | `golangci-lint run` |
| Format | `go fmt ./...` |
| Deps | `go mod tidy` |
| Docker Up | `docker-compose up -d` |
| Docker Down | `docker-compose down` |
| Logs | `docker-compose logs -f api` |
| DB Shell | `docker-compose exec postgres psql -U turbozap -d turbozap` |

