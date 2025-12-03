# TurboZap API - Regras do Projeto

Regras de engenharia, arquitetura e padrões de código para o TurboZap-api.

---

## 1. Arquitetura

### 1.1 Clean Architecture + DDD

O projeto segue Clean Architecture com Domain-Driven Design:

```
┌─────────────────────────────────────────────────────────────┐
│                      Interface Layer                        │
│  (HTTP Handlers, Routers, Middlewares, Response Formatters) │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│         (Use Cases, DTOs, Application Services)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                           │
│    (Entities, Value Objects, Repository Interfaces)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                      │
│   (Repository Implementations, External Services, DB)       │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Regras de Dependência

```
✅ Interface     → Application
✅ Interface     → Domain (apenas para tipos)
✅ Application   → Domain
✅ Infrastructure → Domain (implementa interfaces)
✅ Infrastructure → Application (para DTOs se necessário)

❌ Domain        → Application
❌ Domain        → Infrastructure
❌ Domain        → Interface
❌ Application   → Infrastructure
❌ Application   → Interface
```

### 1.3 Estrutura de Diretórios

```
internal/
├── domain/                    # Núcleo do negócio
│   ├── entity/               # Entidades de domínio
│   │   ├── instance.go       # Instância WhatsApp
│   │   ├── message.go        # Mensagens
│   │   ├── group.go          # Grupos
│   │   ├── contact.go        # Contatos
│   │   └── webhook.go        # Configuração de webhook
│   └── repository/           # Interfaces de repositório
│       ├── instance_repository.go
│       ├── message_repository.go
│       └── webhook_repository.go
│
├── application/              # Lógica de aplicação
│   ├── usecase/             # Casos de uso
│   │   ├── instance/        # Use cases de instância
│   │   ├── message/         # Use cases de mensagem
│   │   └── group/           # Use cases de grupo
│   └── dto/                 # Data Transfer Objects
│       ├── instance_dto.go
│       ├── message_dto.go
│       └── webhook_dto.go
│
├── infrastructure/           # Implementações externas
│   ├── database/            # Conexão e migrations
│   │   └── postgres.go
│   ├── repository/          # Implementações de repositório
│   │   ├── instance_postgres.go
│   │   ├── message_postgres.go
│   │   └── webhook_postgres.go
│   ├── whatsapp/            # Integração whatsmeow
│   │   ├── client.go        # Manager de clientes
│   │   ├── handlers.go      # Event handlers
│   │   ├── store.go         # Session store
│   │   └── qrcode.go        # QR Code generator
│   └── webhook/             # HTTP dispatcher
│       └── dispatcher.go
│
└── interface/                # Camada de apresentação
    ├── http/
    │   ├── router.go        # Setup de rotas
    │   ├── middleware/      # Middlewares HTTP
    │   │   ├── auth.go
    │   │   ├── cors.go
    │   │   └── logger.go
    │   └── handler/         # HTTP handlers
    │       ├── instance_handler.go
    │       ├── message_handler.go
    │       ├── group_handler.go
    │       ├── contact_handler.go
    │       ├── presence_handler.go
    │       └── webhook_handler.go
    └── response/            # Formatação de responses
        └── response.go
```

---

## 2. Princípios SOLID

### 2.1 Single Responsibility Principle (SRP)
Cada struct/função tem uma única razão para mudar.

```go
// ❌ Violação: Handler fazendo muitas coisas
func (h *Handler) Create(c *fiber.Ctx) error {
    // Parse request
    // Validar
    // Conectar ao DB
    // Salvar
    // Enviar webhook
    // Formatar response
}

// ✅ Correto: Responsabilidades separadas
func (h *Handler) Create(c *fiber.Ctx) error {
    req, err := h.parseRequest(c)      // Parser
    if err := h.validate(req); err != nil { ... }  // Validator
    result, err := h.service.Create(req)  // Service
    return h.respond(c, result)        // Responder
}
```

### 2.2 Open/Closed Principle (OCP)
Aberto para extensão, fechado para modificação.

```go
// ✅ Extensível via interface
type MessageSender interface {
    Send(ctx context.Context, msg Message) error
}

type TextSender struct{}
type MediaSender struct{}
type LocationSender struct{}
// Novos tipos não modificam existentes
```

### 2.3 Liskov Substitution Principle (LSP)
Subtipos devem ser substituíveis por seus tipos base.

```go
// ✅ Qualquer implementação de Repository pode ser usada
type InstanceRepository interface {
    FindByID(ctx context.Context, id string) (*Instance, error)
}

// Postgres, Memory, Mock - todos substituíveis
```

### 2.4 Interface Segregation Principle (ISP)
Interfaces pequenas e específicas.

```go
// ❌ Interface muito grande
type Repository interface {
    FindAll() ([]*Entity, error)
    FindByID(id string) (*Entity, error)
    Create(e *Entity) error
    Update(e *Entity) error
    Delete(id string) error
    FindByStatus(status string) ([]*Entity, error)
    FindByDate(date time.Time) ([]*Entity, error)
}

// ✅ Interfaces segregadas
type Reader interface {
    FindByID(ctx context.Context, id string) (*Entity, error)
}

type Writer interface {
    Create(ctx context.Context, e *Entity) error
    Update(ctx context.Context, e *Entity) error
}

type Deleter interface {
    Delete(ctx context.Context, id string) error
}
```

### 2.5 Dependency Inversion Principle (DIP)
Depender de abstrações, não implementações.

```go
// ❌ Dependendo de implementação concreta
type Service struct {
    repo *PostgresRepository  // Acoplado ao Postgres
}

// ✅ Dependendo de interface
type Service struct {
    repo Repository  // Interface definida no domain
}
```

---

## 3. Padrões de Código Go

### 3.1 Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Pacotes | lowercase | `handler`, `repository` |
| Arquivos | snake_case | `instance_handler.go` |
| Structs exportadas | PascalCase | `InstanceHandler` |
| Structs privadas | camelCase | `clientManager` |
| Interfaces | PascalCase + sufixo | `InstanceRepository`, `MessageSender` |
| Constantes | PascalCase ou SCREAMING_SNAKE | `StatusActive`, `MAX_RETRIES` |
| Variáveis | camelCase | `instanceID`, `phoneNumber` |

### 3.2 Error Handling

```go
// Definir errors de domínio
var (
    ErrNotFound       = errors.New("not found")
    ErrUnauthorized   = errors.New("unauthorized")
    ErrBadRequest     = errors.New("bad request")
    ErrAlreadyExists  = errors.New("already exists")
)

// Sempre wrap errors com contexto
func (s *Service) Create(ctx context.Context, input Input) error {
    if err := s.repo.Save(ctx, input); err != nil {
        return fmt.Errorf("failed to save: %w", err)
    }
    return nil
}

// Verificar tipo de error
if errors.Is(err, ErrNotFound) {
    return response.NotFound(c, "Instance not found")
}
```

### 3.3 Context

```go
// Sempre primeiro parâmetro em funções I/O
func (r *Repository) FindByID(ctx context.Context, id string) (*Entity, error)

// Propagar context em toda a chain
func (h *Handler) Get(c *fiber.Ctx) error {
    ctx := c.Context()
    result, err := h.service.Get(ctx, id)
    // ...
}
```

### 3.4 Dependency Injection

```go
// Construtor retorna ponteiro
func NewService(repo Repository, logger *zap.Logger) *Service {
    return &Service{
        repo:   repo,
        logger: logger,
    }
}

// Nunca criar dependências dentro da struct
func NewService() *Service {
    return &Service{
        repo: NewPostgresRepository(),  // ❌ Não fazer
    }
}
```

### 3.5 Concorrência

```go
// Proteger estado compartilhado
type Manager struct {
    mu      sync.RWMutex
    clients map[string]*Client
}

func (m *Manager) Get(id string) (*Client, bool) {
    m.mu.RLock()
    defer m.mu.RUnlock()
    client, ok := m.clients[id]
    return client, ok
}

func (m *Manager) Set(id string, client *Client) {
    m.mu.Lock()
    defer m.mu.Unlock()
    m.clients[id] = client
}
```

---

## 4. API HTTP

### 4.1 Estrutura de Response

```go
// Sucesso
{
    "success": true,
    "data": { ... }
}

// Erro
{
    "success": false,
    "error": {
        "code": "INSTANCE_NOT_FOUND",
        "message": "Instance with ID 'xyz' not found"
    }
}

// Lista com paginação
{
    "success": true,
    "data": [...],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 100
    }
}
```

### 4.2 Códigos HTTP

| Código | Uso |
|--------|-----|
| 200 | Sucesso geral |
| 201 | Recurso criado |
| 204 | Sucesso sem conteúdo |
| 400 | Bad Request (validação) |
| 401 | Unauthorized (sem autenticação) |
| 403 | Forbidden (sem permissão) |
| 404 | Not Found |
| 409 | Conflict (duplicado) |
| 500 | Internal Server Error |

### 4.3 Validação de Entrada

```go
type CreateInstanceRequest struct {
    Name   string `json:"name" validate:"required,min=3,max=50,alphanum"`
    APIKey string `json:"apiKey" validate:"required,min=32"`
}

// No handler
if err := c.BodyParser(&req); err != nil {
    return response.BadRequest(c, "Invalid JSON")
}

if err := h.validate.Struct(req); err != nil {
    return response.BadRequest(c, err.Error())
}
```

---

## 5. Testes

### 5.1 Estrutura de Testes

```go
// Table-driven tests
func TestService_Create(t *testing.T) {
    tests := []struct {
        name    string
        input   CreateInput
        mock    func(*MockRepository)
        want    *Entity
        wantErr error
    }{
        {
            name:  "success",
            input: CreateInput{Name: "test"},
            mock: func(m *MockRepository) {
                m.EXPECT().Save(gomock.Any(), gomock.Any()).Return(nil)
            },
            want: &Entity{Name: "test"},
        },
        {
            name:  "duplicate name",
            input: CreateInput{Name: "existing"},
            mock: func(m *MockRepository) {
                m.EXPECT().Save(gomock.Any(), gomock.Any()).Return(ErrAlreadyExists)
            },
            wantErr: ErrAlreadyExists,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // setup
            ctrl := gomock.NewController(t)
            defer ctrl.Finish()
            
            mockRepo := NewMockRepository(ctrl)
            tt.mock(mockRepo)
            
            svc := NewService(mockRepo, zap.NewNop())
            
            // execute
            got, err := svc.Create(context.Background(), tt.input)
            
            // assert
            if tt.wantErr != nil {
                assert.ErrorIs(t, err, tt.wantErr)
                return
            }
            assert.NoError(t, err)
            assert.Equal(t, tt.want.Name, got.Name)
        })
    }
}
```

### 5.2 Mocks

```go
// Usar mockgen para gerar mocks
//go:generate mockgen -source=repository.go -destination=mocks/repository_mock.go

// Ou criar manualmente para casos simples
type MockRepository struct {
    FindByIDFn func(ctx context.Context, id string) (*Entity, error)
}

func (m *MockRepository) FindByID(ctx context.Context, id string) (*Entity, error) {
    return m.FindByIDFn(ctx, id)
}
```

---

## 6. Logging

### 6.1 Níveis

| Nível | Uso |
|-------|-----|
| Debug | Detalhes para desenvolvimento |
| Info | Eventos normais de operação |
| Warn | Situações anômalas não críticas |
| Error | Erros que precisam de atenção |

### 6.2 Campos Estruturados

```go
// ✅ Sempre usar campos estruturados
logger.Info("instance connected",
    zap.String("instance", name),
    zap.String("phone", phone),
    zap.Duration("duration", elapsed),
)

// ❌ Evitar formatação de string
logger.Info(fmt.Sprintf("Instance %s connected with phone %s", name, phone))
```

### 6.3 Dados Sensíveis

```go
// ❌ Nunca logar
logger.Info("request", zap.String("apiKey", apiKey))
logger.Info("auth", zap.String("password", password))

// ✅ Mascarar ou omitir
logger.Info("request", zap.String("apiKey", "***"))
logger.Info("auth", zap.Bool("hasPassword", password != ""))
```

---

## 7. Segurança

### 7.1 Autenticação
- API Key em header `X-Api-Key`
- Validar em middleware antes de handlers
- Não expor chaves em logs ou responses

### 7.2 Validação
- Validar toda entrada externa
- Sanitizar strings antes de usar
- Limitar tamanho de payloads

### 7.3 Configuração
- Usar variáveis de ambiente
- Nunca commitar secrets
- Manter `.env` no `.gitignore`

---

## 8. Checklist de PR

- [ ] Código compila: `go build ./...`
- [ ] Testes passam: `go test ./...`
- [ ] Sem race conditions: `go test -race ./...`
- [ ] Lint passa: `golangci-lint run`
- [ ] Arquitetura respeitada (dependências corretas)
- [ ] Errors tratados adequadamente
- [ ] Context propagado em operações I/O
- [ ] Logging estruturado
- [ ] Sem dados sensíveis expostos
- [ ] Documentação atualizada se necessário

