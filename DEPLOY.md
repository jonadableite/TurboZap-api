# Deploy no EasyPanel

Este documento descreve como fazer deploy do TurboZap API no EasyPanel usando Docker.

## Pré-requisitos

- EasyPanel configurado na sua VPS
- Banco de dados PostgreSQL (pode ser um serviço separado ou container)
- Variáveis de ambiente configuradas

## Passo a Passo

### 1. Preparar o Repositório

Certifique-se de que o código está no repositório Git (GitHub, GitLab, etc.).

### 2. Criar Aplicação no EasyPanel

1. Acesse o EasyPanel
2. Clique em "New App"
3. Selecione "Dockerfile"
4. Configure:
   - **Name**: `turbozap-api`
   - **Repository**: URL do seu repositório Git
   - **Branch**: `main` (ou a branch desejada)
   - **Dockerfile Path**: `Dockerfile` (raiz do projeto)

### 3. Configurar Variáveis de Ambiente

No EasyPanel, adicione as seguintes variáveis de ambiente:

#### Obrigatórias

```env
# Database
DATABASE_URL=postgres://user:password@host:5432/turbozap?sslmode=disable
# ou configure individualmente:
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=turbozap

# Server
SERVER_PORT=8080
SERVER_HOST=0.0.0.0
API_KEY=your_secret_api_key_here

# Frontend API URL (opcional, padrão: http://localhost:8080)
NEXT_PUBLIC_API_URL=http://localhost:8080
```

#### Opcionais

```env
# App
APP_NAME=TurboZap API
APP_VERSION=1.0.0

# WhatsApp
WHATSAPP_DEBUG=false
WHATSAPP_AUTO_RECONNECT=true
WHATSAPP_RECONNECT_INTERVAL=5

# Webhook
WEBHOOK_TIMEOUT=30
WEBHOOK_RETRY_COUNT=3
WEBHOOK_GLOBAL_ENABLED=false
WEBHOOK_GLOBAL_URL=

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# RabbitMQ (opcional)
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/

# Redis (opcional)
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=

# MinIO (opcional)
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=turbozap-media
MINIO_USE_SSL=false
```

### 4. Configurar Portas

No EasyPanel, configure as portas:

- **Port 8080**: Backend API (HTTP)
- **Port 3000**: Frontend Next.js (HTTP)

### 5. Configurar Domínio (Opcional)

Se desejar usar um domínio customizado:

1. Configure o domínio no EasyPanel
2. Configure o proxy reverso para:
   - `/api/*` → `http://localhost:8080`
   - `/*` → `http://localhost:3000`

Ou configure o `NEXT_PUBLIC_API_URL` para apontar para o domínio do backend.

### 6. Deploy

1. Clique em "Deploy" no EasyPanel
2. Aguarde o build e deploy completarem
3. Verifique os logs para garantir que ambos os serviços iniciaram corretamente

## Verificação

Após o deploy, verifique:

1. **Backend Health**: `http://seu-dominio:8080/health`
2. **Frontend**: `http://seu-dominio:3000`
3. **Logs**: Verifique os logs no EasyPanel para confirmar que ambos os serviços estão rodando

## Troubleshooting

### Backend não inicia

- Verifique as variáveis de ambiente do banco de dados
- Verifique os logs do container
- Certifique-se de que o PostgreSQL está acessível

### Frontend não inicia

- Verifique se o build do Next.js foi concluído com sucesso
- Verifique os logs do container
- Certifique-se de que a porta 3000 está exposta

### Erro de conexão entre frontend e backend

- Configure `NEXT_PUBLIC_API_URL` corretamente
- Se estiver usando domínio, use o domínio completo (ex: `https://api.seudominio.com`)
- Verifique as configurações de CORS no backend

## Estrutura do Dockerfile

O Dockerfile usa multi-stage build:

1. **Stage 1**: Build do backend Go
2. **Stage 2**: Build do frontend Next.js (standalone)
3. **Stage 3**: Runtime com ambos os serviços rodando

O script `start.sh` gerencia ambos os processos e garante shutdown graceful.

## Notas

- O container roda como usuário não-root (`appuser`) por segurança
- Health checks estão configurados para ambos os serviços
- O frontend usa output standalone do Next.js para reduzir o tamanho da imagem
- Ambos os serviços são monitorados e reiniciados automaticamente se um deles falhar

