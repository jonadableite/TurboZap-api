# Deploy no EasyPanel

Este documento descreve como fazer deploy do TurboZap API no EasyPanel usando Dockerfiles separados para backend e frontend.

## Arquitetura

O projeto usa **dois containers separados**:
- **Backend** (Go API) - Porta 8080
- **Frontend** (Next.js) - Porta 3000

Isso permite:
- ✅ Escalabilidade independente
- ✅ Deploy independente de cada serviço
- ✅ Melhor uso de recursos
- ✅ Facilita debugging e manutenção

## Pré-requisitos

- EasyPanel configurado na sua VPS
- Banco de dados PostgreSQL (pode ser um serviço separado ou container)
- Variáveis de ambiente configuradas

## Opção 1: Usar Imagens Pré-buildadas (Recomendado - Código Privado)

Esta opção mantém seu código fonte privado, usando imagens já buildadas em um registry.

### Pré-requisitos

1. Build e push das imagens para um registry (veja `BUILD_AND_PUSH.md`)
2. Credenciais do registry configuradas no EasyPanel (se necessário)

### Backend

1. Acesse o EasyPanel
2. Clique em "New App"
3. Selecione **"Docker Image"** (não "Dockerfile")
4. Configure:
   - **Name**: `turbozap-backend`
   - **Image**: `seu-registry/turbozap-backend:v1.0.0` (ou `latest`)
   - **Registry Credentials**: Se necessário, adicione credenciais

### Frontend

1. Acesse o EasyPanel
2. Clique em "New App"
3. Selecione **"Docker Image"**
4. Configure:
   - **Name**: `turbozap-frontend`
   - **Image**: `seu-registry/turbozap-frontend:v1.0.0` (ou `latest`)
   - **Registry Credentials**: Se necessário, adicione credenciais

**Vantagens:**
- ✅ Código fonte não exposto
- ✅ Build mais rápido
- ✅ Controle de versão
- ✅ Segurança aprimorada

## Opção 2: Deploy com Dockerfile (Código Público)

### Backend

1. Acesse o EasyPanel
2. Clique em "New App"
3. Selecione "Dockerfile"
4. Configure:
   - **Name**: `turbozap-backend`
   - **Repository**: URL do seu repositório Git
   - **Branch**: `main` (ou a branch desejada)
   - **Dockerfile Path**: `Dockerfile.backend`

### Frontend

1. Acesse o EasyPanel
2. Clique em "New App"
3. Selecione "Dockerfile"
4. Configure:
   - **Name**: `turbozap-frontend`
   - **Repository**: URL do seu repositório Git
   - **Branch**: `main` (ou a branch desejada)
   - **Dockerfile Path**: `Dockerfile.frontend`

## Opção 3: Docker Compose

Se preferir usar Docker Compose:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Configurar Variáveis de Ambiente

### Backend (turbozap-backend)

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

### Frontend (turbozap-frontend)

#### Obrigatórias

```env
# API URL do backend
NEXT_PUBLIC_API_URL=http://turbozap-backend:8080
# ou se estiver usando domínio:
# NEXT_PUBLIC_API_URL=https://api.seudominio.com
```

#### Opcionais

```env
PORT=3000
HOSTNAME=0.0.0.0
```

## Configurar Portas

### Backend
- **Port 8080**: Backend API (HTTP)

### Frontend
- **Port 3000**: Frontend Next.js (HTTP)

## Configurar Domínio (Opcional)

Se desejar usar um domínio customizado:

1. Configure o domínio no EasyPanel para o frontend
2. Configure o proxy reverso para:
   - `/api/*` → `http://turbozap-backend:8080`
   - `/*` → `http://turbozap-frontend:3000`

Ou configure o `NEXT_PUBLIC_API_URL` para apontar para o domínio do backend.

## Networking

Se estiver usando containers separados no EasyPanel, você pode:

1. **Usar nomes de serviço**: Se ambos estiverem na mesma rede Docker, use `http://turbozap-backend:8080`
2. **Usar IP interno**: Configure o `NEXT_PUBLIC_API_URL` com o IP interno do container backend
3. **Usar domínio externo**: Configure o `NEXT_PUBLIC_API_URL` com o domínio público do backend

## Deploy

### Backend

1. Clique em "Deploy" no EasyPanel para o backend
2. Aguarde o build e deploy completarem
3. Verifique os logs para garantir que o serviço iniciou corretamente

### Frontend

1. Clique em "Deploy" no EasyPanel para o frontend
2. Aguarde o build e deploy completarem
3. Verifique os logs para garantir que o serviço iniciou corretamente

## Verificação

Após o deploy, verifique:

1. **Backend Health**: `http://seu-dominio-backend:8080/health`
2. **Frontend**: `http://seu-dominio-frontend:3000`
3. **Logs**: Verifique os logs no EasyPanel para confirmar que ambos os serviços estão rodando

## Troubleshooting

### Backend não inicia

- Verifique as variáveis de ambiente do banco de dados
- Verifique os logs do container
- Certifique-se de que o PostgreSQL está acessível
- Verifique se a porta 8080 está exposta

### Frontend não inicia

- Verifique se o build do Next.js foi concluído com sucesso
- Verifique os logs do container
- Certifique-se de que a porta 3000 está exposta
- Verifique se o `NEXT_PUBLIC_API_URL` está configurado corretamente

### Erro de conexão entre frontend e backend

- Configure `NEXT_PUBLIC_API_URL` corretamente
  - Se estiver na mesma rede Docker: `http://turbozap-backend:8080`
  - Se estiver usando domínio: `https://api.seudominio.com`
- Verifique as configurações de CORS no backend
- Verifique se o backend está acessível do frontend

### Frontend não consegue conectar ao backend

- Verifique se ambos os containers estão na mesma rede Docker
- Verifique se o nome do serviço backend está correto
- Teste a conectividade: `curl http://turbozap-backend:8080/health` do container frontend

## Estrutura dos Dockerfiles

### Dockerfile.backend

- **Stage 1**: Build do backend Go
- **Stage 2**: Runtime com apenas o binário Go
- Tamanho final: ~15-20MB

### Dockerfile.frontend

- **Stage 1**: Build do frontend Next.js (standalone)
- **Stage 2**: Runtime com apenas os arquivos necessários
- Tamanho final: ~150-200MB

## Vantagens da Arquitetura Separada

1. **Escalabilidade**: Pode escalar backend e frontend independentemente
2. **Deploy**: Pode atualizar um serviço sem afetar o outro
3. **Recursos**: Cada container usa apenas os recursos necessários
4. **Debugging**: Logs e métricas separados facilitam troubleshooting
5. **Manutenção**: Mais fácil de manter e atualizar

## Notas

- Ambos os containers rodam como usuário não-root (`appuser`) por segurança
- Health checks estão configurados para ambos os serviços
- O frontend usa output standalone do Next.js para reduzir o tamanho da imagem
- Os containers podem ser orquestrados independentemente
