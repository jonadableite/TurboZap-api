# TurboZap API

API REST para WhatsApp usando a biblioteca [whatsmeow](https://github.com/tulir/whatsmeow) em Go.

## Características

- **Multi-instância**: Suporte a múltiplos números de WhatsApp simultaneamente
- **Webhooks**: Sistema de webhooks para receber eventos em tempo real
- **Envio de mensagens**: Texto, mídia, áudio, stickers, localização, contatos, enquetes, reações, stories
- **Grupos**: Criar, gerenciar participantes, entrar via link de convite
- **Contatos**: Verificar números, obter foto de perfil, bloquear/desbloquear
- **Presença**: Online/offline, digitando, gravando áudio
- **Type-safe**: Arquitetura DDD com Go, type-safe e SOLID

## Requisitos

- Go 1.22+
- PostgreSQL 14+
- Docker (opcional)

## Instalação

### Com Docker (Recomendado)

```bash
# Clone o repositório
git clone https://github.com/jonadableite/turbozap-api.git
cd turbozap-api

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Inicie com Docker Compose
docker-compose up -d
```

### Sem Docker

```bash
# Clone o repositório
git clone https://github.com/jonadableite/turbozap-api.git
cd turbozap-api

# Instale as dependências
go mod download

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Execute
go run ./cmd/api
```

## Configuração

Variáveis de ambiente disponíveis:

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `SERVER_PORT` | Porta do servidor | `8080` |
| `SERVER_HOST` | Host do servidor | `0.0.0.0` |
| `API_KEY` | Chave de API global | - |
| `DATABASE_URL` | URL de conexão PostgreSQL | - |
| `WHATSAPP_DEBUG` | Ativar debug do whatsmeow | `false` |
| `WHATSAPP_AUTO_RECONNECT` | Reconexão automática | `true` |
| `WEBHOOK_TIMEOUT` | Timeout de webhook (segundos) | `30` |
| `WEBHOOK_RETRY_COUNT` | Tentativas de retry | `3` |
| `LOG_LEVEL` | Nível de log | `info` |

## Autenticação

A API usa autenticação via API Key. Envie a chave no header:

```
X-API-Key: sua-api-key
```

Ou via Authorization Bearer:

```
Authorization: Bearer sua-api-key
```

## Endpoints

### Instâncias

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/instance/create` | Criar nova instância |
| GET | `/api/instance/list` | Listar instâncias |
| GET | `/api/instance/:name` | Obter instância |
| GET | `/api/instance/:name/status` | Status da conexão |
| GET | `/api/instance/:name/qrcode` | Obter QR Code |
| POST | `/api/instance/:name/connect` | Conectar instância |
| PUT | `/api/instance/:name/restart` | Reiniciar instância |
| POST | `/api/instance/:name/logout` | Desconectar |
| DELETE | `/api/instance/:name` | Deletar instância |

### Mensagens

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/message/:instance/text` | Enviar texto |
| POST | `/api/message/:instance/media` | Enviar mídia |
| POST | `/api/message/:instance/audio` | Enviar áudio |
| POST | `/api/message/:instance/sticker` | Enviar sticker |
| POST | `/api/message/:instance/location` | Enviar localização |
| POST | `/api/message/:instance/contact` | Enviar contato |
| POST | `/api/message/:instance/reaction` | Enviar reação |
| POST | `/api/message/:instance/poll` | Enviar enquete |
| POST | `/api/message/:instance/button` | Enviar botões |
| POST | `/api/message/:instance/list` | Enviar lista |
| POST | `/api/message/:instance/carousel` | Enviar carrossel |
| POST | `/api/message/:instance/story` | Enviar story |

### Grupos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/group/:instance/create` | Criar grupo |
| GET | `/api/group/:instance/list` | Listar grupos |
| GET | `/api/group/:instance/:groupId` | Info do grupo |
| PUT | `/api/group/:instance/:groupId` | Atualizar grupo |
| PUT | `/api/group/:instance/:groupId/participants` | Gerenciar participantes |
| POST | `/api/group/:instance/join` | Entrar via link |
| DELETE | `/api/group/:instance/:groupId/leave` | Sair do grupo |
| GET | `/api/group/:instance/:groupId/invite` | Obter link de convite |

### Contatos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/contact/:instance/check` | Verificar números |
| GET | `/api/contact/:instance/list` | Listar contatos |
| GET | `/api/contact/:instance/:jid` | Info do contato |
| GET | `/api/contact/:instance/:jid/picture` | Foto de perfil |
| POST | `/api/contact/:instance/block` | Bloquear contato |
| POST | `/api/contact/:instance/unblock` | Desbloquear contato |

### Presença

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/presence/:instance/available` | Marcar online |
| POST | `/api/presence/:instance/unavailable` | Marcar offline |
| POST | `/api/presence/:instance/composing` | Digitando |
| POST | `/api/presence/:instance/recording` | Gravando áudio |
| POST | `/api/presence/:instance/clear` | Limpar presença |
| POST | `/api/presence/:instance/subscribe` | Assinar presença |

### Webhook

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/webhook/:instance/set` | Configurar webhook |
| GET | `/api/webhook/:instance` | Obter config |
| DELETE | `/api/webhook/:instance` | Remover webhook |
| POST | `/api/webhook/:instance/enable` | Ativar webhook |
| POST | `/api/webhook/:instance/disable` | Desativar webhook |
| GET | `/api/webhook/events` | Listar eventos |

## Eventos de Webhook

- `message.received` - Nova mensagem recebida
- `message.sent` - Mensagem enviada
- `message.ack` - Confirmação de entrega/leitura
- `message.revoked` - Mensagem revogada
- `connection.update` - Mudança de conexão
- `qrcode.updated` - Novo QR Code
- `group.participants.update` - Mudança em participantes
- `group.update` - Atualização de grupo
- `presence.update` - Atualização de presença
- `call.received` - Chamada recebida
- `call.missed` - Chamada perdida
- `poll.vote` - Voto em enquete
- `button.response` - Resposta de botão
- `list.response` - Resposta de lista
- `story.viewed` - Story visualizado

## Exemplos de Uso

### Criar Instância

```bash
curl -X POST http://localhost:8080/api/instance/create \
  -H "X-API-Key: sua-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "minha-instancia"}'
```

### Obter QR Code

```bash
curl http://localhost:8080/api/instance/minha-instancia/qrcode \
  -H "X-API-Key: sua-api-key"
```

### Enviar Mensagem de Texto

```bash
curl -X POST http://localhost:8080/api/message/minha-instancia/text \
  -H "X-API-Key: sua-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "text": "Olá! Esta é uma mensagem de teste."
  }'
```

### Enviar Imagem

```bash
curl -X POST http://localhost:8080/api/message/minha-instancia/media \
  -H "X-API-Key: sua-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "media_url": "https://example.com/image.jpg",
    "caption": "Legenda da imagem"
  }'
```

### Configurar Webhook

```bash
curl -X POST http://localhost:8080/api/webhook/minha-instancia/set \
  -H "X-API-Key: sua-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://seu-servidor.com/webhook",
    "events": ["message.received", "message.ack"],
    "enabled": true
  }'
```

## Arquitetura

O projeto segue arquitetura DDD (Domain-Driven Design) com os seguintes componentes:

```
TurboZap-api/
├── cmd/api/           # Entry point
├── internal/
│   ├── domain/        # Entidades e interfaces
│   ├── application/   # DTOs e use cases
│   ├── infrastructure/ # Implementações (DB, WhatsApp)
│   └── interface/     # HTTP handlers e middlewares
└── pkg/               # Utilitários compartilhados
```

## Licença

MIT

## Contribuições

Contribuições são bem-vindas! Abra uma issue ou pull request.

