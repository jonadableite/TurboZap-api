# TurboZap API - Agent Playbook

Guia operacional rápido para qualquer agente (Cursor, Claude, etc.) entregar alterações consistentes no TurboZap-api.

---

## 1. Objetivo

Garantir que todas as alterações no código sigam os padrões estabelecidos de arquitetura (DDD + Clean Architecture), princípios SOLID, e boas práticas de Go, mantendo consistência e qualidade em todo o projeto.

---

## 2. Fluxo Operacional (Spec-Driven)

### Passo 1: Entender o Contexto
```
1. Leia a solicitação do usuário completamente
2. Identifique qual camada será afetada:
   - Domain (entidades, interfaces)
   - Application (use cases, DTOs)
   - Infrastructure (repositórios, whatsapp, webhook)
   - Interface (handlers HTTP, routers)
3. Verifique arquivos existentes com `codebase_search` ou `read_file`
```

### Passo 2: Planejar
```
1. Liste as alterações necessárias em ordem
2. Identifique dependências entre alterações
3. Estime impacto em testes existentes
4. Use `todo_write` para tarefas complexas (3+ arquivos)
```

### Passo 3: Implementar
```
1. Siga a ordem: Domain → Application → Infrastructure → Interface
2. Um arquivo por vez, validando compilação
3. Mantenha consistência com código existente
4. Propague context.Context em operações I/O
```

### Passo 4: Validar
```bash
# Build
go build ./...

# Testes
go test ./... -v

# Lint (se disponível)
golangci-lint run
```

### Passo 5: Documentar
```
1. Atualize README se APIs mudaram
2. Adicione comentários em código complexo
3. Use o template de resposta final abaixo
```

---

## 3. Ferramentas Recomendadas

### Busca e Leitura
| Ferramenta | Quando Usar |
|------------|-------------|
| `codebase_search` | Encontrar implementações por conceito |
| `grep` | Busca exata de texto/símbolos |
| `read_file` | Ler arquivo específico |
| `list_dir` | Explorar estrutura de diretórios |

### Modificação
| Ferramenta | Quando Usar |
|------------|-------------|
| `write` | Criar arquivo novo ou reescrever completo |
| `search_replace` | Modificar trecho específico |

### Execução
| Ferramenta | Quando Usar |
|------------|-------------|
| `run_terminal_cmd` | Build, test, comandos shell |
| `read_lints` | Verificar erros de compilação |

---

## 4. Checklist Antes de Finalizar

### Código
- [ ] Compila sem erros: `go build ./...`
- [ ] Segue convenções de nomenclatura Go
- [ ] Errors tratados (não ignorados)
- [ ] Context propagado em I/O
- [ ] Sem dados sensíveis hardcoded

### Arquitetura
- [ ] Domain não importa pacotes externos
- [ ] Interfaces definidas em domain/repository
- [ ] DTOs em application/dto
- [ ] Handlers em interface/http/handler

### Testes
- [ ] Testes existentes passam
- [ ] Novos testes para funcionalidades adicionadas
- [ ] Cenários de erro cobertos

### Documentação
- [ ] README atualizado se necessário
- [ ] Comentários em código complexo
- [ ] Exemplos de uso se API nova

---

## 5. Template de Resposta Final

```markdown
### Resumo
- (breve descrição das mudanças realizadas)

### Arquivos Modificados
- `internal/domain/entity/novo.go` – Nova entidade criada
- `internal/interface/http/handler/novo_handler.go` – Handler HTTP
- `internal/infrastructure/repository/novo_postgres.go` – Implementação do repositório

### Comandos de Validação
```bash
go build ./...   # ✅ Build OK
go test ./...    # ✅ Testes passando
```

### Próximos Passos
- (se aplicável, liste tarefas pendentes ou sugestões)

### Observações
- (notas importantes, trade-offs, limitações conhecidas)
```

---

## 6. Padrões de Código

### Estrutura de Handler HTTP
```go
// internal/interface/http/handler/example_handler.go
package handler

type ExampleHandler struct {
    service    *service.ExampleService
    logger     *zap.Logger
    validate   *validator.Validate
}

func NewExampleHandler(svc *service.ExampleService, logger *zap.Logger) *ExampleHandler {
    return &ExampleHandler{
        service:  svc,
        logger:   logger,
        validate: validator.New(),
    }
}

func (h *ExampleHandler) Create(c *fiber.Ctx) error {
    var req dto.CreateExampleRequest
    
    if err := c.BodyParser(&req); err != nil {
        return response.BadRequest(c, "Invalid request body")
    }
    
    if err := h.validate.Struct(req); err != nil {
        return response.BadRequest(c, err.Error())
    }
    
    result, err := h.service.Create(c.Context(), req)
    if err != nil {
        h.logger.Error("failed to create", zap.Error(err))
        return response.InternalServerError(c, "Failed to create")
    }
    
    return response.Success(c, result)
}
```

### Estrutura de Repository
```go
// internal/infrastructure/repository/example_postgres.go
package repository

type PostgresExampleRepository struct {
    db     *pgxpool.Pool
    logger *zap.Logger
}

func NewPostgresExampleRepository(db *pgxpool.Pool, logger *zap.Logger) *PostgresExampleRepository {
    return &PostgresExampleRepository{db: db, logger: logger}
}

func (r *PostgresExampleRepository) FindByID(ctx context.Context, id string) (*entity.Example, error) {
    query := `SELECT id, name, created_at FROM examples WHERE id = $1`
    
    var e entity.Example
    err := r.db.QueryRow(ctx, query, id).Scan(&e.ID, &e.Name, &e.CreatedAt)
    if err != nil {
        if errors.Is(err, pgx.ErrNoRows) {
            return nil, entity.ErrNotFound
        }
        return nil, fmt.Errorf("query failed: %w", err)
    }
    
    return &e, nil
}
```

### Estrutura de Entidade
```go
// internal/domain/entity/example.go
package entity

import (
    "errors"
    "time"
)

var (
    ErrNotFound     = errors.New("not found")
    ErrInvalidInput = errors.New("invalid input")
)

type Example struct {
    ID        string    `json:"id"`
    Name      string    `json:"name"`
    Status    string    `json:"status"`
    CreatedAt time.Time `json:"createdAt"`
    UpdatedAt time.Time `json:"updatedAt"`
}

func NewExample(name string) *Example {
    return &Example{
        ID:        uuid.New().String(),
        Name:      name,
        Status:    "active",
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }
}
```

---

## 7. Fontes Oficiais

| Documento | Conteúdo |
|-----------|----------|
| `AGENTS.md` | Contrato do agente e missão |
| `PROJECT_RULES.md` | Regras de engenharia, SOLID e arquitetura |
| `PROJECT_COMMANDS.md` | Comandos de execução |
| `.cursorrules` | Regras específicas para Cursor |
| `README.md` | Documentação geral do projeto |

---

## 8. Erros Comuns a Evitar

### ❌ Não Fazer
```go
// Ignorar errors
result, _ := service.DoSomething()

// Panic em produção
if err != nil {
    panic(err)
}

// Hardcode de configuração
apiKey := "secret-key-123"

// Import circular
// domain importando infrastructure
```

### ✅ Fazer
```go
// Tratar errors
result, err := service.DoSomething()
if err != nil {
    return fmt.Errorf("failed: %w", err)
}

// Retornar error
if err != nil {
    return err
}

// Usar configuração
apiKey := config.APIKey

// Dependency inversion
// domain define interface, infrastructure implementa
```

---

## 9. Comandos Frequentes

```bash
# Desenvolvimento
go run ./cmd/api                    # Rodar servidor
go build -o turbozap ./cmd/api      # Build binário
go test ./... -v                    # Rodar testes
go test ./... -race                 # Detectar race conditions
go test ./... -coverprofile=c.out   # Coverage

# Qualidade
golangci-lint run                   # Lint
go vet ./...                        # Análise estática
go mod tidy                         # Limpar dependências

# Docker
docker-compose up -d                # Subir containers
docker-compose down                 # Parar containers
docker-compose logs -f api          # Ver logs

# Database
docker-compose exec postgres psql -U turbozap -d turbozap
```

---

Siga este playbook em toda interação para garantir entregas coerentes e auditáveis.

