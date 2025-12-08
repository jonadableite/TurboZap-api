# Dockerfiles do TurboZap

Este projeto possui **dois Dockerfiles separados** para backend e frontend, permitindo deploy e escalabilidade independentes.

## Arquivos

- **`Dockerfile.backend`**: Backend Go API (porta 8080)
- **`Dockerfile.frontend`**: Frontend Next.js (porta 3000)
- **`docker-compose.prod.yml`**: Orquestração dos dois serviços
- **`Dockerfile`**: Dockerfile original (monolítico) - mantido para compatibilidade

## Build Local

### Backend

```bash
docker build -f Dockerfile.backend -t turbozap-backend .
```

### Frontend

```bash
docker build -f Dockerfile.frontend -t turbozap-frontend .
```

## Executar Localmente

### Usando Docker Compose

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Executar Separadamente

**Backend:**
```bash
docker run -d \
  -p 8080:8080 \
  -e DATABASE_URL=postgres://user:pass@host:5432/db \
  -e API_KEY=your_key \
  --name turbozap-backend \
  turbozap-backend
```

**Frontend:**
```bash
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:8080 \
  --name turbozap-frontend \
  turbozap-frontend
```

## Variáveis de Ambiente

### Backend

Ver `DEPLOY.md` para lista completa. Principais:

- `DATABASE_URL` - URL de conexão PostgreSQL
- `API_KEY` - Chave de API
- `SERVER_PORT` - Porta do servidor (padrão: 8080)

### Frontend

- `NEXT_PUBLIC_API_URL` - URL do backend (ex: `http://turbozap-backend:8080`)
- `PORT` - Porta do servidor (padrão: 3000)

## Estrutura

### Dockerfile.backend

1. **Builder Stage**: Compila o binário Go
2. **Runtime Stage**: Imagem Alpine minimal com apenas o binário

**Tamanho**: ~15-20MB

### Dockerfile.frontend

1. **Builder Stage**: Build do Next.js com output standalone
2. **Runtime Stage**: Imagem Node.js Alpine com apenas os arquivos necessários

**Tamanho**: ~150-200MB

## Vantagens

✅ **Escalabilidade Independente**: Escale backend e frontend separadamente  
✅ **Deploy Independente**: Atualize um serviço sem afetar o outro  
✅ **Recursos Otimizados**: Cada container usa apenas o necessário  
✅ **Debugging Facilitado**: Logs e métricas separados  
✅ **Manutenção Simplificada**: Mais fácil de manter e atualizar

## Deploy no EasyPanel

Veja `DEPLOY.md` para instruções completas de deploy no EasyPanel.

