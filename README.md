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
| `POST` | `/webhook/:instance` | Configurar webhook |
| `DELETE` | `/webhook/:instance` | Remover webhook |

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

### Configurar Webhook

```bash
curl -X POST http://localhost:8080/webhook/minha-instancia \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://meu-servidor.com/webhook",
    "events": ["message_received", "message_ack", "connection_update"],
    "headers": {
      "Authorization": "Bearer meu-token"
    }
  }'
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

Eventos enviados para o webhook configurado:

| Evento | Descrição |
|--------|-----------|
| `message_received` | Nova mensagem recebida |
| `message_ack` | Status de mensagem (sent/delivered/read) |
| `connection_update` | Mudança no status de conexão |
| `qrcode_update` | Novo QR code gerado |
| `presence_update` | Atualização de presença |
| `group_update` | Mudanças em grupos |

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
