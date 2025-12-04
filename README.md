# TurboZap API

> 🚀 API REST de WhatsApp em Go usando a biblioteca [whatsmeow](https://github.com/tulir/whatsmeow) - Self-hosted, multi-instance, com suporte a mensagens interativas.

[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat&logo=go)](https://go.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com/)

**Autores:**  
[Fernando Sorrentino](https://github.com/Sorretino) • [Jonadab Leite](https://github.com/jonadableite)

## 📋 Índice

- [Características](#-características)
- [Arquitetura](#-arquitetura)
- [Requisitos](#-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Endpoints da API](#-endpoints-da-api)
- [WebSocket](#-websocket)
- [Webhooks](#-webhooks)
- [Exemplos de Uso](#-exemplos-de-uso)
- [Limitações](#-limitações)
- [Monitoramento](#-monitoramento)
- [Contribuição](#-contribuição)

## ✨ Características

- **Multi-instância**: Gerencie múltiplos números de WhatsApp simultaneamente
- **Mensagens Interativas**: Suporte a botões e listas usando protobufs nativos do WhatsApp
- **WebSocket**: Eventos em tempo real para integração
- **Webhooks**: Notificações HTTP para eventos de mensagens
- **Filas de Mensagens**: RabbitMQ para alta vazão e confiabilidade
- **Rate Limiting**: Redis para controle de taxa e deduplicação
- **Armazenamento de Mídia**: MinIO para arquivos de mídia
- **Monitoramento**: Prometheus + Grafana para métricas

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        TurboZap API                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐   │
│  │  Fiber  │────▶│ Handler │────▶│ Manager │────▶│whatsmeow│   │
│  │  HTTP   │     │ Layer   │     │  Layer  │     │ Client  │   │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘   │
│       │               │               │               │          │
│       ▼               ▼               ▼               ▼          │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐   │
│  │  Auth   │     │  DTO    │     │ Events  │     │ WhatsApp│   │
│  │Middleware│     │Validate │     │ Handler │     │  Web    │   │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘   │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │PostgreSQL│  │  Redis  │  │RabbitMQ │  │  MinIO  │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Requisitos

- Go 1.22+
- Docker & Docker Compose
- PostgreSQL 16+
- Redis 7+
- RabbitMQ 3.13+
- MinIO (opcional)

## 🚀 Instalação

### Usando Docker Compose (Recomendado)

```bash
# Clone o repositório
git clone https://github.com/jonadableite/turbozap-api.git
cd turbozap-api

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env conforme necessário

# Inicie os serviços
docker-compose up -d

# Verifique os logs
docker-compose logs -f turbozap
```

### Desenvolvimento Local

```bash
# Instale as dependências
go mod download

# Execute as migrações (PostgreSQL deve estar rodando)
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/turbozap?sslmode=disable"

# Execute a API
go run ./cmd/api
```

## ⚙️ Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `SERVER_PORT` | Porta do servidor HTTP | `8080` |
| `SERVER_HOST` | Host do servidor | `0.0.0.0` |
| `API_KEY` | Chave de API global | - |
| `DATABASE_URL` | URL do PostgreSQL | - |
| `RABBITMQ_URL` | URL do RabbitMQ | `amqp://guest:guest@localhost:5672/` |
| `REDIS_URL` | URL do Redis | `redis://localhost:6379` |
| `MINIO_ENDPOINT` | Endpoint do MinIO | `localhost:9000` |
| `MINIO_ACCESS_KEY` | Access key do MinIO | `minioadmin` |
| `MINIO_SECRET_KEY` | Secret key do MinIO | `minioadmin` |
| `LOG_LEVEL` | Nível de log | `info` |

### Variáveis de Webhook Global

O TurboZap suporta webhooks globais que recebem eventos de todas as instâncias. Configure as seguintes variáveis de ambiente:

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `WEBHOOK_GLOBAL_ENABLED` | Habilita webhook global | `false` |
| `WEBHOOK_GLOBAL_URL` | URL base do webhook global | - |
| `WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS` | Usa URL específica por evento | `false` |
| `WEBHOOK_GLOBAL_BASE64` | Codifica payload em base64 | `false` |
| `WEBHOOK_EVENTS_APPLICATION_STARTUP` | Evento de inicialização | `false` |
| `WEBHOOK_EVENTS_QRCODE_UPDATED` | Evento de QR code atualizado | `true` |
| `WEBHOOK_EVENTS_CONNECTION_UPDATE` | Evento de atualização de conexão | `true` |
| `WEBHOOK_EVENTS_MESSAGES_SET` | Evento de sincronização de mensagens | `false` |
| `WEBHOOK_EVENTS_MESSAGES_UPSERT` | Evento de nova mensagem | `true` |
| `WEBHOOK_EVENTS_MESSAGES_UPDATE` | Evento de atualização de mensagem | `true` |
| `WEBHOOK_EVENTS_MESSAGES_DELETE` | Evento de mensagem deletada | `true` |
| `WEBHOOK_EVENTS_SEND_MESSAGE` | Evento de mensagem enviada | `true` |
| `WEBHOOK_EVENTS_CONTACTS_SET` | Evento de sincronização de contatos | `false` |
| `WEBHOOK_EVENTS_CONTACTS_UPSERT` | Evento de contato atualizado | `false` |
| `WEBHOOK_EVENTS_CONTACTS_UPDATE` | Evento de atualização de contato | `false` |
| `WEBHOOK_EVENTS_PRESENCE_UPDATE` | Evento de atualização de presença | `true` |
| `WEBHOOK_EVENTS_CHATS_SET` | Evento de sincronização de chats | `false` |
| `WEBHOOK_EVENTS_CHATS_UPDATE` | Evento de atualização de chat | `false` |
| `WEBHOOK_EVENTS_CHATS_UPSERT` | Evento de novo chat | `false` |
| `WEBHOOK_EVENTS_CHATS_DELETE` | Evento de chat deletado | `false` |
| `WEBHOOK_EVENTS_GROUPS_UPSERT` | Evento de grupo criado/atualizado | `true` |
| `WEBHOOK_EVENTS_GROUPS_UPDATE` | Evento de atualização de grupo | `true` |
| `WEBHOOK_EVENTS_GROUP_PARTICIPANTS_UPDATE` | Evento de participantes do grupo | `true` |
| `WEBHOOK_EVENTS_ERRORS` | Eventos de erro | `false` |
| `WEBHOOK_EVENTS_ERRORS_WEBHOOK` | URL específica para erros | - |

**Exemplo de configuração no `.env`:**

```bash
# Webhook Global
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_URL=https://meu-servidor.com/webhook
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false
WEBHOOK_GLOBAL_BASE64=false

# Eventos habilitados
WEBHOOK_EVENTS_QRCODE_UPDATED=true
WEBHOOK_EVENTS_MESSAGES_UPSERT=true
WEBHOOK_EVENTS_CONNECTION_UPDATE=true
WEBHOOK_EVENTS_GROUPS_UPSERT=true
```

## 📡 Endpoints da API

### Instâncias

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/instance/create` | Criar nova instância |
| `GET` | `/instance/list` | Listar todas as instâncias |
| `GET` | `/instance/:name` | Obter detalhes de uma instância |
| `GET` | `/instance/:name/status` | Obter status de conexão |
| `GET` | `/instance/:name/qrcode` | Obter QR code para conexão |
| `POST` | `/instance/:name/connect` | Conectar instância |
| `POST` | `/instance/:name/restart` | Reiniciar instância |
| `POST` | `/instance/:name/logout` | Desconectar da sessão |
| `DELETE` | `/instance/:name` | Deletar instância |

### Mensagens

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/message/:instance/text` | Enviar mensagem de texto |
| `POST` | `/message/:instance/media` | Enviar mídia (imagem/vídeo/documento) |
| `POST` | `/message/:instance/audio` | Enviar áudio/voz |
| `POST` | `/message/:instance/sticker` | Enviar sticker |
| `POST` | `/message/:instance/location` | Enviar localização |
| `POST` | `/message/:instance/contact` | Enviar cartão de contato |
| `POST` | `/message/:instance/reaction` | Enviar reação |
| `POST` | `/message/:instance/poll` | Enviar enquete |
| `POST` | `/message/:instance/button` | Enviar mensagem com botões |
| `POST` | `/message/:instance/list` | Enviar mensagem de lista |

### Grupos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/group/:instance/list` | Listar grupos |
| `GET` | `/group/:instance/:jid` | Obter info do grupo |
| `POST` | `/group/:instance/create` | Criar grupo |
| `POST` | `/group/:instance/:jid/leave` | Sair do grupo |
| `POST` | `/group/:instance/:jid/participants/add` | Adicionar participantes |
| `POST` | `/group/:instance/:jid/participants/remove` | Remover participantes |

### Webhooks

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/webhook/:instance` | Obter configuração de webhook |
| `POST` | `/webhook/:instance/set` | Configurar webhook |
| `DELETE` | `/webhook/:instance` | Remover webhook |
| `POST` | `/webhook/:instance/enable` | Habilitar webhook |
| `POST` | `/webhook/:instance/disable` | Desabilitar webhook |
| `GET` | `/webhook/events` | Listar todos os eventos disponíveis |

## 📨 Exemplos de Uso

### Criar Instância

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "minha-instancia"}'
```

### Enviar Mensagem com Botões

```bash
curl -X POST http://localhost:8080/message/minha-instancia/button \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "text": "Escolha uma opção:",
    "footer": "Powered by TurboZap",
    "buttons": [
      {"id": "btn_1", "text": "👍 Sim"},
      {"id": "btn_2", "text": "👎 Não"},
      {"id": "btn_3", "text": "🤔 Talvez"}
    ],
    "header": {
      "type": "text",
      "text": "Confirmação"
    }
  }'
```

### Enviar Lista

```bash
curl -X POST http://localhost:8080/message/minha-instancia/list \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "title": "Menu Principal",
    "description": "Selecione uma opção do menu",
    "button_text": "📋 Abrir Menu",
    "footer": "TurboZap API",
    "sections": [
      {
        "title": "🛒 Produtos",
        "rows": [
          {"id": "prod_1", "title": "Produto A", "description": "R$ 99,90"},
          {"id": "prod_2", "title": "Produto B", "description": "R$ 149,90"}
        ]
      },
      {
        "title": "ℹ️ Informações",
        "rows": [
          {"id": "info_1", "title": "Sobre nós"},
          {"id": "info_2", "title": "Contato"}
        ]
      }
    ]
  }'
```

### Configurar Webhook por Instância

```bash
curl -X POST http://localhost:8080/webhook/minha-instancia/set \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://meu-servidor.com/webhook",
    "events": ["message.received", "message.ack", "connection.update"],
    "webhook_by_events": false,
    "webhook_base64": false,
    "enabled": true,
    "headers": {
      "Authorization": "Bearer meu-token"
    }
  }'
```

### Obter Configuração de Webhook

```bash
curl -X GET http://localhost:8080/webhook/minha-instancia \
  -H "X-API-Key: your-api-key"
```

**Resposta:**

```json
{
  "success": true,
  "data": {
    "enabled": true,
    "url": "https://meu-servidor.com/webhook",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": [
      "message.received",
      "message.ack",
      "connection.update"
    ]
  }
}
```

## 🔌 WebSocket

Conecte-se ao WebSocket para receber eventos em tempo real:

```javascript
const ws = new WebSocket('ws://localhost:8080/ws?token=your-api-key&instance_id=uuid');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Evento:', data.event, data.data);
};

// Eventos disponíveis:
// - incoming_message
// - message_status
// - button_click
// - list_selection
// - connection_update
// - qrcode_update
```

## 🪝 Webhooks

O TurboZap suporta dois tipos de webhooks:

### Webhooks por Instância

Configure webhooks específicos para cada instância através do endpoint `/webhook/:instance`. Cada instância pode ter sua própria URL e lista de eventos.

### Webhooks Globais

Configure um webhook global que recebe eventos de todas as instâncias através das variáveis de ambiente `WEBHOOK_GLOBAL_*`. Útil para centralizar o processamento de eventos.

### Eventos Disponíveis

| Evento | Descrição | Slug (para webhook_by_events) |
|--------|-----------|-------------------------------|
| `application_startup` | Inicialização da aplicação | `application-startup` |
| `qrcode.updated` | Novo QR code gerado | `qrcode-updated` |
| `connection.update` | Mudança no status de conexão | `connection-update` |
| `messages.set` | Sincronização inicial de mensagens | `messages-set` |
| `message.received` | Nova mensagem recebida | `messages-upsert` |
| `messages.update` | Atualização de mensagem (status) | `messages-update` |
| `messages.delete` | Mensagem deletada | `messages-delete` |
| `message.sent` | Mensagem enviada pela API | `send-message` |
| `contacts.set` | Sincronização inicial de contatos | `contacts-set` |
| `contacts.upsert` | Contato criado/atualizado | `contacts-upsert` |
| `contacts.update` | Atualização de contato | `contacts-update` |
| `presence.update` | Atualização de presença | `presence-update` |
| `chats.set` | Sincronização inicial de chats | `chats-set` |
| `chats.update` | Atualização de chat | `chats-update` |
| `chats.upsert` | Novo chat criado | `chats-upsert` |
| `chats.delete` | Chat deletado | `chats-delete` |
| `groups.upsert` | Grupo criado/atualizado | `groups-upsert` |
| `groups.update` | Atualização de grupo | `groups-update` |
| `group.participants.update` | Mudança em participantes | `group-participants-update` |

### Webhook por Eventos (`webhook_by_events`)

Quando `webhook_by_events` está habilitado, o TurboZap adiciona automaticamente o slug do evento ao final da URL do webhook.

**Exemplo:**

- URL base: `https://meu-servidor.com/webhook`
- Evento: `messages-upsert`
- URL final: `https://meu-servidor.com/webhook/messages-upsert`

Isso permite criar endpoints específicos para cada tipo de evento no seu servidor.

### Payload Base64

Quando `webhook_base64` ou `WEBHOOK_GLOBAL_BASE64` está habilitado, o payload JSON completo é codificado em base64 antes de ser enviado.

**Formato do Payload:**

```json
{
  "event": "message.received",
  "instance_id": "550e8400-e29b-41d4-a716-446655440000",
  "instance": "minha-instancia",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "message_id": "3EB0123456789ABCDEF",
    "from": "5511999999999@s.whatsapp.net",
    "to": "5511888888888@s.whatsapp.net",
    "type": "text",
    "content": "Olá, mundo!",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Com Base64 habilitado:**

O payload acima seria enviado como uma string base64 no corpo da requisição, com o header `Content-Type: text/plain` e `X-Content-Transfer-Encoding: base64`.

**Exemplo de decodificação (Node.js):**

```javascript
const base64Payload = req.body; // String base64
const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf-8'));
console.log('Evento:', payload.event);
console.log('Dados:', payload.data);
```

### Configuração de Webhook por Instância

```bash
curl -X POST http://localhost:8080/webhook/minha-instancia \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://meu-servidor.com/webhook",
    "events": ["message.received", "message.ack", "connection.update"],
    "webhook_by_events": false,
    "webhook_base64": false,
    "enabled": true,
    "headers": {
      "Authorization": "Bearer meu-token"
    }
  }'
```

### Estrutura do Payload

Todos os webhooks seguem a mesma estrutura:

```json
{
  "event": "string",
  "instance_id": "uuid",
  "instance": "string",
  "timestamp": "ISO8601",
  "data": {}
}
```

O campo `data` varia conforme o tipo de evento. Consulte a documentação da API para ver a estrutura específica de cada evento.

### Exemplo Prático: Webhook Global com Base64

**Configuração no `.env`:**

```bash
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_URL=https://api.meuservidor.com/webhooks/turbozap
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true
WEBHOOK_GLOBAL_BASE64=true

# Habilitar apenas eventos importantes
WEBHOOK_EVENTS_MESSAGES_UPSERT=true
WEBHOOK_EVENTS_CONNECTION_UPDATE=true
WEBHOOK_EVENTS_QRCODE_UPDATED=true
```

**Comportamento:**

- Evento `messages-upsert` → POST para `https://api.meuservidor.com/webhooks/turbozap/messages-upsert`
- Payload será enviado como string base64 no corpo da requisição
- Header `X-Content-Transfer-Encoding: base64` será incluído

**Handler no seu servidor (Express.js exemplo):**

```javascript
app.post('/webhooks/turbozap/messages-upsert', (req, res) => {
  // Decodificar payload base64
  const base64Payload = req.body;
  const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf-8'));
  
  console.log('Instância:', payload.instance);
  console.log('Mensagem:', payload.data);
  
  // Processar mensagem...
  
  res.status(200).json({ received: true });
});
```

### Exemplo Prático: Webhook por Instância sem Base64

**Configuração via API:**

```bash
curl -X POST http://localhost:8080/webhook/minha-instancia/set \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.meuservidor.com/webhooks/instancia-1",
    "events": ["message.received", "message.ack"],
    "webhook_by_events": false,
    "webhook_base64": false,
    "enabled": true
  }'
```

**Comportamento:**

- Todos os eventos serão enviados para `https://api.meuservidor.com/webhooks/instancia-1`
- Payload será JSON normal no corpo da requisição
- Header `Content-Type: application/json`

**Handler no seu servidor:**

```javascript
app.post('/webhooks/instancia-1', (req, res) => {
  const payload = req.body; // Já é um objeto JSON
  
  console.log('Evento:', payload.event);
  console.log('Dados:', payload.data);
  
  // Processar evento...
  
  res.status(200).json({ received: true });
});
```

### Headers Personalizados

Você pode adicionar headers personalizados aos webhooks:

```json
{
  "url": "https://api.meuservidor.com/webhook",
  "headers": {
    "Authorization": "Bearer token-secreto",
    "X-Custom-Header": "valor-customizado"
  }
}
```

Esses headers serão incluídos em todas as requisições do webhook.

## ⚠️ Limitações

### WhatsApp Web vs Cloud API

| Recurso | WhatsApp Web (whatsmeow) | Cloud API |
|---------|-------------------------|-----------|
| Botões | ✅ Limitado | ✅ Completo |
| Listas | ✅ Limitado | ✅ Completo |
| Carrossel | ❌ Não suportado | ✅ Suportado |
| Templates | ❌ Não suportado | ✅ Suportado |
| Custo | Gratuito | Pago por mensagem |

> **Nota**: Mensagens interativas (botões/listas) podem ter suporte limitado em alguns dispositivos ou versões do WhatsApp.

## 📊 Monitoramento

### Prometheus Metrics

Acesse as métricas em `http://localhost:8080/metrics`:

- `turbozap_messages_sent_total` - Total de mensagens enviadas
- `turbozap_messages_received_total` - Total de mensagens recebidas
- `turbozap_instances_active` - Instâncias ativas
- `turbozap_http_requests_total` - Requisições HTTP

### Grafana Dashboard

Acesse o Grafana em `http://localhost:3000` (admin/admin) para visualizar dashboards.

### UIs de Administração

- **Adminer** (PostgreSQL): http://localhost:8081
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

## 🧪 Testes

```bash
# Rodar todos os testes
go test ./...

# Com cobertura
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out

# Testes específicos
go test ./internal/application/dto/...
```

## 🔧 Desenvolvimento

```bash
# Build
go build -o turbozap ./cmd/api

# Lint
golangci-lint run

# Gerar mocks
mockgen -source=internal/domain/repository/instance_repository.go \
        -destination=internal/mocks/instance_repository_mock.go
```

## 📚 Documentação Adicional

- [Guia de Migração para Cloud API](docs/MIGRATION_GUIDE.md)
- [Plano Operacional](docs/OPERATIONAL_PLAN.md)
- [Arquitetura Detalhada](docs/ARCHITECTURE.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- [whatsmeow](https://github.com/tulir/whatsmeow) - Biblioteca Go para WhatsApp Web
- [Fiber](https://gofiber.io/) - Framework web para Go

---

Feito com ❤️ por [TurboZap Team](https://github.com/jonadableite)
