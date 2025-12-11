<div align="center">

# 🚀 TurboZap API

> **API REST de WhatsApp em Go** - Self-hosted, multi-instance, com suporte completo a mensagens interativas

[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7+-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13+-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)

[![GitHub stars](https://img.shields.io/github/stars/jonadableite/turbozap-api?style=for-the-badge&logo=github&color=yellow)](https://github.com/jonadableite/turbozap-api/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/jonadableite/turbozap-api?style=for-the-badge&logo=github&color=blue)](https://github.com/jonadableite/turbozap-api/network/members)
[![GitHub issues](https://img.shields.io/github/issues/jonadableite/turbozap-api?style=for-the-badge&logo=github&color=red)](https://github.com/jonadableite/turbozap-api/issues)

**Construído com** [whatsmeow](https://github.com/tulir/whatsmeow) • **Framework** [Fiber](https://gofiber.io/)

**Autores:** [Fernando Sorrentino](https://github.com/Sorretino) • [Jonadab Leite](https://github.com/jonadableite)

[📖 Documentação](#-documentação-adicional) • [🚀 Quick Start](#-quick-start) • [💬 Suporte](https://github.com/jonadableite/turbozap-api/issues) • [🤝 Contribuir](#-contribuição)

---

</div>

## 📑 Índice

<details>
<summary>Clique para expandir</summary>

- [✨ Características](#-características)
- [🏗️ Arquitetura](#️-arquitetura)
- [⚡ Quick Start](#-quick-start)
- [📦 Requisitos](#-requisitos)
- [🚀 Instalação](#-instalação)
- [⚙️ Configuração](#️-configuração)
- [📡 Endpoints da API](#-endpoints-da-api)
- [💡 Exemplos de Uso](#-exemplos-de-uso)
- [🔌 WebSocket](#-websocket)
- [🪝 Webhooks](#-webhooks)
- [⚠️ Limitações](#️-limitações)
- [📊 Monitoramento](#-monitoramento)
- [🧪 Testes](#-testes)
- [🔧 Desenvolvimento](#-desenvolvimento)
- [📚 Documentação Adicional](#-documentação-adicional)
- [🤝 Contribuição](#-contribuição)

</details>

---

## ✨ Características

<div align="center">

### 🎯 Recursos Principais

</div>

<table>
<tr>
<td width="50%" valign="top">

#### 🔄 Multi-instância
Gerencie múltiplos números de WhatsApp simultaneamente com isolamento completo entre instâncias.

#### 💬 Mensagens Interativas
- ✅ Botões (até 3 opções)
- ✅ Listas (múltiplas seções)
- ✅ Headers personalizados (texto, imagem, vídeo, documento)
- ✅ Compatibilidade total (Android, iOS, Web)

#### 🔌 Integração em Tempo Real
- WebSocket para eventos instantâneos
- Webhooks HTTP configuráveis
- SSE (Server-Sent Events)

</td>
<td width="50%" valign="top">

#### 🚀 Alta Performance
- RabbitMQ para filas de mensagens
- Redis para rate limiting
- MinIO para armazenamento de mídia

#### 📊 Monitoramento
- Prometheus metrics
- Grafana dashboards
- Logs estruturados

#### 🔒 Segurança
- Autenticação por API Key
- Middleware de validação
- Headers personalizados em webhooks

</td>
</tr>
</table>

<div align="center">

### 🎨 Mensagens Interativas

| Tipo | Suporte | Limites |
|------|---------|---------|
| **Botões** | ✅ Completo | Até 3 botões por mensagem |
| **Listas** | ✅ Completo | Até 10 linhas por seção |
| **Headers** | ✅ Completo | Texto, Imagem, Vídeo, Documento |
| **Carrossel** | ❌ Não suportado | - |
| **Templates** | ❌ Não suportado | - |

> 💡 **Nota**: Mensagens interativas são automaticamente envolvidas em `ViewOnceMessage/FutureProofMessage` para garantir compatibilidade entre dispositivos.

</div>

---

## 🏗️ Arquitetura

<div align="center">

```mermaid
graph TB
    subgraph "Application Layer"
        A[Fiber HTTP] --> B[Handler Layer]
        B --> C[Manager Layer]
        C --> D[whatsmeow Client]
    end
    
    subgraph "Infrastructure Layer"
        E[PostgreSQL] 
        F[Redis]
        G[RabbitMQ]
        H[MinIO]
    end
    
    B --> E
    B --> F
    C --> G
    C --> H
    
    style A fill:#00ADD8
    style B fill:#00ADD8
    style C fill:#00ADD8
    style D fill:#25D366
    style E fill:#336791
    style F fill:#DC382D
    style G fill:#FF6600
    style H fill:#FFC649
```

### 📐 Diagrama de Arquitetura Simplificado

```
┌─────────────────────────────────────────────────────────────┐
│                    TurboZap API                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐             │
│  │  Fiber  │────▶│ Handler │────▶│ Manager │             │
│  │  HTTP   │     │ Layer   │     │  Layer  │             │
│  └─────────┘     └─────────┘     └─────────┘             │
│       │               │               │                     │
│       ▼               ▼               ▼                     │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐             │
│  │  Auth   │     │  DTO    │     │ Events  │             │
│  │Middleware│     │Validate │     │ Handler │             │
│  └─────────┘     └─────────┘     └─────────┘             │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                        │
│  ┌──────────┐  ┌────────┐  ┌─────────┐  ┌───────┐        │
│  │PostgreSQL│  │ Redis  │  │RabbitMQ │  │ MinIO │        │
│  └──────────┘  └────────┘  └─────────┘  └───────┘        │
└─────────────────────────────────────────────────────────────┘
```

</div>

---

## ⚡ Quick Start

<div align="center">

### 🐳 Docker Compose (Recomendado)

</div>

```bash
# 1. Clone o repositório
git clone https://github.com/jonadableite/turbozap-api.git
cd turbozap-api

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env conforme necessário

# 3. Inicie os serviços
docker-compose up -d

# 4. Verifique os logs
docker-compose logs -f turbozap

# 5. Acesse a API
curl http://localhost:8080/health
```

<div align="center">

### 💻 Desenvolvimento Local

</div>

```bash
# 1. Instale as dependências
go mod download

# 2. Configure o banco de dados
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/turbozap?sslmode=disable"

# 3. Execute a API
go run ./cmd/api

# 4. Teste a API
curl http://localhost:8080/health
```

<div align="center">

### 🎯 Primeiro Exemplo

</div>

```bash
# Criar uma instância
curl -X POST http://localhost:8080/instance/create \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "minha-instancia"}'

# Obter QR Code
curl -X GET http://localhost:8080/instance/minha-instancia/qrcode \
  -H "X-API-Key: your-api-key"

# Enviar mensagem
curl -X POST http://localhost:8080/message/minha-instancia/text \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "text": "Olá do TurboZap! 🚀"
  }'
```

---

## 📦 Requisitos

| Componente | Versão | Status |
|------------|--------|--------|
| **Go** | 1.22+ | ✅ Obrigatório |
| **Docker** | Latest | ✅ Recomendado |
| **Docker Compose** | Latest | ✅ Recomendado |
| **PostgreSQL** | 16+ | ✅ Obrigatório |
| **Redis** | 7+ | ✅ Obrigatório |
| **RabbitMQ** | 3.13+ | ✅ Obrigatório |
| **MinIO** | Latest | ⚠️ Opcional |

---

## 🚀 Instalação

### 🐳 Usando Docker Compose (Recomendado)

<details>
<summary><b>Clique para expandir</b></summary>

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

</details>

### 💻 Desenvolvimento Local

<details>
<summary><b>Clique para expandir</b></summary>

```bash
# Instale as dependências
go mod download

# Execute as migrações (PostgreSQL deve estar rodando)
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/turbozap?sslmode=disable"

# Execute a API
go run ./cmd/api
```

</details>

---

## ⚙️ Configuração

### 🔧 Variáveis de Ambiente

<details>
<summary><b>Ver todas as variáveis</b></summary>

| Variável           | Descrição              | Padrão                               |
| ------------------ | ---------------------- | ------------------------------------ |
| `SERVER_PORT`      | Porta do servidor HTTP | `8080`                               |
| `SERVER_HOST`      | Host do servidor       | `0.0.0.0`                            |
| `API_KEY`          | Chave de API global    | -                                    |
| `DATABASE_URL`     | URL do PostgreSQL      | -                                    |
| `RABBITMQ_URL`     | URL do RabbitMQ        | `amqp://guest:guest@localhost:5672/` |
| `REDIS_URL`        | URL do Redis           | `redis://localhost:6379`             |
| `MINIO_ENDPOINT`   | Endpoint do MinIO      | `localhost:9000`                     |
| `MINIO_ACCESS_KEY` | Access key do MinIO    | `minioadmin`                         |
| `MINIO_SECRET_KEY` | Secret key do MinIO    | `minioadmin`                         |
| `LOG_LEVEL`        | Nível de log           | `info`                               |

</details>

### 🪝 Variáveis de Webhook Global

<details>
<summary><b>Ver configurações de webhook</b></summary>

O TurboZap suporta webhooks globais que recebem eventos de todas as instâncias.

| Variável                                   | Descrição                            | Padrão  |
| ------------------------------------------ | ------------------------------------ | ------- |
| `WEBHOOK_GLOBAL_ENABLED`                   | Habilita webhook global              | `false` |
| `WEBHOOK_GLOBAL_URL`                       | URL base do webhook global           | -       |
| `WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS`         | Usa URL específica por evento        | `false` |
| `WEBHOOK_GLOBAL_BASE64`                    | Codifica payload em base64           | `false` |
| `WEBHOOK_EVENTS_QRCODE_UPDATED`            | Evento de QR code atualizado         | `true`  |
| `WEBHOOK_EVENTS_CONNECTION_UPDATE`         | Evento de atualização de conexão     | `true`  |
| `WEBHOOK_EVENTS_MESSAGES_UPSERT`           | Evento de nova mensagem              | `true`  |
| `WEBHOOK_EVENTS_MESSAGES_UPDATE`           | Evento de atualização de mensagem    | `true`  |
| `WEBHOOK_EVENTS_MESSAGES_DELETE`           | Evento de mensagem deletada          | `true`  |
| `WEBHOOK_EVENTS_SEND_MESSAGE`              | Evento de mensagem enviada           | `true`  |
| `WEBHOOK_EVENTS_PRESENCE_UPDATE`           | Evento de atualização de presença    | `true`  |
| `WEBHOOK_EVENTS_GROUPS_UPSERT`             | Evento de grupo criado/atualizado    | `true`  |
| `WEBHOOK_EVENTS_GROUPS_UPDATE`             | Evento de atualização de grupo       | `true`  |
| `WEBHOOK_EVENTS_GROUP_PARTICIPANTS_UPDATE` | Evento de participantes do grupo     | `true`  |

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

</details>

---

## 📡 Endpoints da API

### 📱 Instâncias

| Método   | Endpoint                  | Descrição                       |
| -------- | ------------------------- | ------------------------------- |
| `POST`   | `/instance/create`        | Criar nova instância            |
| `GET`    | `/instance/list`          | Listar todas as instâncias      |
| `GET`    | `/instance/:name`         | Obter detalhes de uma instância |
| `GET`    | `/instance/:name/status`  | Obter status de conexão         |
| `GET`    | `/instance/:name/qrcode`  | Obter QR code para conexão      |
| `POST`   | `/instance/:name/connect` | Conectar instância              |
| `PUT`    | `/instance/:name/restart` | Reiniciar instância             |
| `POST`   | `/instance/:name/logout`  | Desconectar da sessão           |
| `DELETE` | `/instance/:name`         | Deletar instância               |
| `PUT`    | `/instance/:name/name`    | Atualizar nome da instância     |

### 💬 Mensagens

| Método | Endpoint                      | Descrição                             |
| ------ | ----------------------------- | ------------------------------------- |
| `POST` | `/message/:instance/text`     | Enviar mensagem de texto              |
| `POST` | `/message/:instance/media`    | Enviar mídia (imagem/vídeo/documento) |
| `POST` | `/message/:instance/audio`    | Enviar áudio/voz                      |
| `POST` | `/message/:instance/sticker`  | Enviar sticker                        |
| `POST` | `/message/:instance/location` | Enviar localização                    |
| `POST` | `/message/:instance/contact`  | Enviar cartão de contato              |
| `POST` | `/message/:instance/reaction` | Enviar reação                         |
| `POST` | `/message/:instance/poll`     | Enviar enquete                        |
| `POST` | `/message/:instance/button`   | Enviar mensagem com botões            |
| `POST` | `/message/:instance/list`     | Enviar mensagem de lista              |

### 👥 Grupos

| Método | Endpoint                                    | Descrição               |
| ------ | ------------------------------------------- | ----------------------- |
| `GET`  | `/group/:instance/list`                     | Listar grupos           |
| `GET`  | `/group/:instance/:jid`                     | Obter info do grupo     |
| `POST` | `/group/:instance/create`                   | Criar grupo             |
| `POST` | `/group/:instance/:jid/leave`               | Sair do grupo           |
| `POST` | `/group/:instance/:jid/participants/add`    | Adicionar participantes |
| `POST` | `/group/:instance/:jid/participants/remove` | Remover participantes   |

### 🪝 Webhooks

| Método   | Endpoint                     | Descrição                           |
| -------- | ---------------------------- | ----------------------------------- |
| `GET`    | `/webhook/:instance`         | Obter configuração de webhook       |
| `POST`   | `/webhook/:instance/set`     | Configurar webhook                  |
| `DELETE` | `/webhook/:instance`         | Remover webhook                     |
| `POST`   | `/webhook/:instance/enable`  | Habilitar webhook                   |
| `POST`   | `/webhook/:instance/disable` | Desabilitar webhook                 |
| `GET`    | `/webhook/events`            | Listar todos os eventos disponíveis |

### 👤 Perfil e Privacidade

| Método | Endpoint                     | Descrição                           |
| ------ | ---------------------------- | ----------------------------------- |
| `GET`  | `/profile/:instance/privacy` | Obter configurações de privacidade  |
| `POST` | `/profile/:instance/privacy` | Alterar configuração de privacidade |
| `POST` | `/profile/:instance/status`  | Alterar "recado/about" do perfil    |

**Configurações de Privacidade disponíveis:**

- `group_add` - Quem pode adicionar em grupos (all, contacts, contact_blacklist, none)
- `last_seen` - Visto por último (all, contacts, contact_blacklist, none)
- `status` - Status/Stories (all, contacts, contact_blacklist, none)
- `profile` - Foto de perfil (all, contacts, contact_blacklist, none)
- `read_receipts` - Confirmação de leitura (all, none)
- `online` - Status online (all, match_last_seen)
- `call_add` - Chamadas (all, known)

### 📞 Chamadas

| Método | Endpoint                 | Descrição                 |
| ------ | ------------------------ | ------------------------- |
| `POST` | `/call/:instance/reject` | Rejeitar chamada recebida |

### 📡 SSE (Server-Sent Events)

| Método | Endpoint              | Descrição                                |
| ------ | --------------------- | ---------------------------------------- |
| `GET`  | `/sse/:instance`      | Stream SSE para uma instância específica |
| `GET`  | `/sse/`                | Stream SSE global (todas as instâncias)  |
| `GET`  | `/sse/:instance/info` | Informações de conexões SSE              |

---

## 💡 Exemplos de Uso

### 📝 Criar Instância

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "minha-instancia"}'
```

### 🔘 Enviar Mensagem com Botões

> **💡 Nota**: As mensagens com botões são automaticamente envolvidas em `ViewOnceMessage/FutureProofMessage` para garantir renderização correta em todos os dispositivos (Android, iOS, Web).

<details>
<summary><b>Ver exemplos completos</b></summary>

#### Exemplo básico (sem header):

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
    ]
  }'
```

#### Exemplo com header de texto:

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

#### Exemplo com header de imagem:

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
      {"id": "btn_2", "text": "👎 Não"}
    ],
    "header": {
      "type": "image",
      "media_url": "https://exemplo.com/imagem.jpg",
      "mime_type": "image/jpeg"
    }
  }'
```

#### Parâmetros:

| Campo              | Tipo   | Obrigatório | Descrição                                                     |
| ------------------ | ------ | ----------- | ------------------------------------------------------------- |
| `to`               | string | Sim         | Número do destinatário (com código do país)                   |
| `text`             | string | Sim         | Texto principal da mensagem                                   |
| `footer`           | string | Não         | Texto do rodapé                                               |
| `buttons`          | array  | Sim         | Array com 1-3 botões                                          |
| `buttons[].id`     | string | Não\*       | ID único do botão (gerado automaticamente se vazio)           |
| `buttons[].text`   | string | Sim         | Texto exibido no botão                                        |
| `header`           | object | Não         | Cabeçalho da mensagem (text, image, video ou document)        |
| `header.type`      | string | Sim\*\*     | Tipo do header: `text`, `image`, `video` ou `document`        |
| `header.text`      | string | Sim\*\*     | Texto do header (quando `type` é `text`)                      |
| `header.media_url` | string | Sim\*\*     | URL da mídia (quando `type` é `image`, `video` ou `document`) |
| `header.base64`    | string | Não         | Dados da mídia em base64 (alternativa a `media_url`)          |
| `header.mime_type` | string | Sim\*\*     | Tipo MIME da mídia                                            |
| `header.file_name` | string | Não         | Nome do arquivo (quando `type` é `document`)                  |

\* Se não fornecido, será gerado automaticamente como `btn_1`, `btn_2`, etc.  
\*\* Obrigatório dependendo do tipo de header escolhido

</details>

### 📋 Enviar Lista

> **💡 Nota**: As mensagens de lista são automaticamente envolvidas em `ViewOnceMessage/FutureProofMessage` para garantir renderização correta em todos os dispositivos (Android, iOS, Web).

<details>
<summary><b>Ver exemplos completos</b></summary>

#### Exemplo básico:

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
          {"id": "info_1", "title": "Sobre nós", "description": "Conheça nossa empresa"},
          {"id": "info_2", "title": "Contato", "description": "Entre em contato conosco"}
        ]
      }
    ]
  }'
```

#### Parâmetros:

| Campo                           | Tipo   | Obrigatório | Descrição                                                           |
| ------------------------------- | ------ | ----------- | ------------------------------------------------------------------- |
| `to`                            | string | Sim         | Número do destinatário (com código do país)                         |
| `title`                         | string | Sim         | Título da lista (máximo de caracteres conforme limites do WhatsApp) |
| `description`                   | string | Não         | Descrição da lista                                                  |
| `button_text`                   | string | Sim         | Texto do botão que abre a lista                                     |
| `footer`                        | string | Não         | Texto do rodapé                                                     |
| `sections`                      | array  | Sim         | Array com 1 ou mais seções                                          |
| `sections[].title`              | string | Sim         | Título da seção                                                     |
| `sections[].rows`               | array  | Sim         | Array com as linhas da seção (pelo menos 1 linha)                   |
| `sections[].rows[].id`          | string | Não\*       | ID único da linha (gerado automaticamente se vazio)                 |
| `sections[].rows[].title`       | string | Sim         | Título da linha                                                     |
| `sections[].rows[].description` | string | Não         | Descrição da linha                                                  |

\* Se não fornecido, será gerado automaticamente como `row_1_1`, `row_1_2`, etc.

**Limitações:**

- Máximo de **3 botões** por mensagem de botões
- Máximo de **10 linhas por seção** (recomendado pelo WhatsApp)
- Títulos e descrições têm limites de caracteres conforme especificação do WhatsApp
- Seções vazias (sem linhas) são automaticamente ignoradas

</details>

### 🪝 Configurar Webhook por Instância

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

### 📥 Obter Configuração de Webhook

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
    "events": ["message.received", "message.ack", "connection.update"]
  }
}
```

---

## 🔌 WebSocket

Conecte-se ao WebSocket para receber eventos em tempo real:

```javascript
const ws = new WebSocket(
  "ws://localhost:8080/ws?token=your-api-key&instance_id=uuid"
);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Evento:", data.event, data.data);
};

// Eventos disponíveis:
// - incoming_message
// - message_status
// - button_click
// - list_selection
// - connection_update
// - qrcode_update
```

---

## 🪝 Webhooks

O TurboZap suporta dois tipos de webhooks:

### 📍 Webhooks por Instância

Configure webhooks específicos para cada instância através do endpoint `/webhook/:instance`. Cada instância pode ter sua própria URL e lista de eventos.

### 🌐 Webhooks Globais

Configure um webhook global que recebe eventos de todas as instâncias através das variáveis de ambiente `WEBHOOK_GLOBAL_*`. Útil para centralizar o processamento de eventos.

### 📋 Eventos Disponíveis

| Evento                      | Descrição                          | Slug (para webhook_by_events) |
| --------------------------- | ---------------------------------- | ----------------------------- |
| `application_startup`       | Inicialização da aplicação         | `application-startup`         |
| `qrcode.updated`            | Novo QR code gerado                | `qrcode-updated`              |
| `connection.update`         | Mudança no status de conexão       | `connection-update`           |
| `messages.set`              | Sincronização inicial de mensagens | `messages-set`                |
| `message.received`          | Nova mensagem recebida             | `messages-upsert`             |
| `messages.update`           | Atualização de mensagem (status)   | `messages-update`             |
| `messages.delete`           | Mensagem deletada                  | `messages-delete`             |
| `message.sent`              | Mensagem enviada pela API          | `send-message`                |
| `contacts.set`              | Sincronização inicial de contatos  | `contacts-set`                |
| `contacts.upsert`           | Contato criado/atualizado          | `contacts-upsert`             |
| `contacts.update`           | Atualização de contato             | `contacts-update`             |
| `presence.update`           | Atualização de presença            | `presence-update`             |
| `chats.set`                 | Sincronização inicial de chats     | `chats-set`                   |
| `chats.update`              | Atualização de chat                | `chats-update`                |
| `chats.upsert`              | Novo chat criado                   | `chats-upsert`                |
| `chats.delete`              | Chat deletado                      | `chats-delete`                |
| `groups.upsert`             | Grupo criado/atualizado            | `groups-upsert`               |
| `groups.update`             | Atualização de grupo               | `groups-update`               |
| `group.participants.update` | Mudança em participantes           | `group-participants-update`   |

### 🔗 Webhook por Eventos (`webhook_by_events`)

Quando `webhook_by_events` está habilitado, o TurboZap adiciona automaticamente o slug do evento ao final da URL do webhook.

**Exemplo:**

- URL base: `https://meu-servidor.com/webhook`
- Evento: `messages-upsert`
- URL final: `https://meu-servidor.com/webhook/messages-upsert`

Isso permite criar endpoints específicos para cada tipo de evento no seu servidor.

### 📦 Payload Base64

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
const payload = JSON.parse(
  Buffer.from(base64Payload, "base64").toString("utf-8")
);
console.log("Evento:", payload.event);
console.log("Dados:", payload.data);
```

### 💻 Exemplo Prático: Webhook Global com Base64

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

**Handler no seu servidor (Express.js exemplo):**

```javascript
app.post("/webhooks/turbozap/messages-upsert", (req, res) => {
  // Decodificar payload base64
  const base64Payload = req.body;
  const payload = JSON.parse(
    Buffer.from(base64Payload, "base64").toString("utf-8")
  );

  console.log("Instância:", payload.instance);
  console.log("Mensagem:", payload.data);

  // Processar mensagem...

  res.status(200).json({ received: true });
});
```

### 🔐 Headers Personalizados

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

---

## ⚠️ Limitações

### 📊 WhatsApp Web vs Cloud API

| Recurso   | WhatsApp Web (whatsmeow)           | Cloud API         |
| --------- | ---------------------------------- | ----------------- |
| Botões    | ✅ Suportado (até 3 botões)        | ✅ Completo       |
| Listas    | ✅ Suportado (até 10 linhas/seção) | ✅ Completo       |
| Carrossel | ❌ Não suportado                   | ✅ Suportado      |
| Templates | ❌ Não suportado                   | ✅ Suportado      |
| Custo     | Gratuito                           | Pago por mensagem |

### 💬 Mensagens Interativas

**Botões:**

- Máximo de **3 botões** por mensagem
- Tipo de botão: apenas `RESPONSE` (resposta rápida)
- Suporte completo em Android, iOS e WhatsApp Web
- Mensagens são automaticamente envolvidas em `ViewOnceMessage/FutureProofMessage` para compatibilidade entre dispositivos

**Listas:**

- Máximo de **10 linhas por seção** (recomendado)
- Tipo de lista: `SINGLE_SELECT` (seleção única)
- Suporte completo em Android, iOS e WhatsApp Web
- Mensagens são automaticamente envolvidas em `ViewOnceMessage/FutureProofMessage` para compatibilidade entre dispositivos
- Seções vazias são automaticamente ignoradas

**Validações Automáticas:**

- IDs de botões/linhas são gerados automaticamente se não fornecidos
- Listas de botões com mais de 3 itens são automaticamente truncadas
- Validação de parâmetros obrigatórios antes do envio
- Logs detalhados para depuração

> **💡 Nota**: As mensagens interativas são renderizadas corretamente em todos os dispositivos graças ao envelopamento `ViewOnceMessage/FutureProofMessage`. Isso garante compatibilidade entre Android, iOS e WhatsApp Web, mesmo em versões antigas do aplicativo.

---

## 📊 Monitoramento

### 📈 Prometheus Metrics

Acesse as métricas em `http://localhost:8080/metrics`:

- `turbozap_messages_sent_total` - Total de mensagens enviadas
- `turbozap_messages_received_total` - Total de mensagens recebidas
- `turbozap_instances_active` - Instâncias ativas
- `turbozap_http_requests_total` - Requisições HTTP

### 📊 Grafana Dashboard

Acesse o Grafana em `http://localhost:3000` (admin/admin) para visualizar dashboards.

### 🖥️ UIs de Administração

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **Adminer** (PostgreSQL) | http://localhost:8081 | - |
| **RabbitMQ Management** | http://localhost:15672 | guest/guest |
| **MinIO Console** | http://localhost:9001 | minioadmin/minioadmin |

---

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

---

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

---

## 📚 Documentação Adicional

- 📖 [Guia de Migração para Cloud API](docs/MIGRATION_GUIDE.md)
- 📋 [Plano Operacional](docs/OPERATIONAL_PLAN.md)
- 🏗️ [Arquitetura Detalhada](docs/ARCHITECTURE.md)

---

## 🤝 Contribuição

Contribuições são sempre bem-vindas! Siga estes passos:

1. 🍴 **Fork** o projeto
2. 🌿 **Crie** sua branch (`git checkout -b feature/MinhaFeature`)
3. 💾 **Commit** suas mudanças (`git commit -m 'Add MinhaFeature'`)
4. 📤 **Push** para a branch (`git push origin feature/MinhaFeature`)
5. 🔄 **Abra** um Pull Request

### 📝 Diretrizes de Contribuição

- Siga os padrões de código Go
- Adicione testes para novas funcionalidades
- Atualize a documentação conforme necessário
- Mantenha os commits descritivos

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🙏 Agradecimentos

<div align="center">

### 🛠️ Tecnologias Utilizadas

[![whatsmeow](https://img.shields.io/badge/whatsmeow-Go%20WhatsApp%20Library-25D366?style=flat-square&logo=whatsapp)](https://github.com/tulir/whatsmeow)
[![Fiber](https://img.shields.io/badge/Fiber-Web%20Framework-00ADD8?style=flat-square&logo=go)](https://gofiber.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=flat-square&logo=redis)](https://redis.io/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-Message%20Queue-FF6600?style=flat-square&logo=rabbitmq)](https://www.rabbitmq.com/)

</div>

---

<div align="center">

### ⭐ Se este projeto foi útil para você, considere dar uma estrela!

**Feito com ❤️ por [TurboZap Team](https://github.com/jonadableite)**

[⬆ Voltar ao topo](#-turbozap-api)

</div>
