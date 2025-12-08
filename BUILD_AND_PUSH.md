# Build e Push das Imagens Docker

Este guia explica como fazer build e push das imagens Docker para um registry, mantendo o código fonte privado.

## Por que usar imagens pré-buildadas?

✅ **Código fonte privado**: O código não fica exposto no repositório público  
✅ **Build mais rápido**: Não precisa compilar no EasyPanel  
✅ **Controle de versão**: Você controla quais versões estão disponíveis  
✅ **Segurança**: Apenas imagens aprovadas são deployadas  

## Registries Suportados

- **Docker Hub**: `docker.io/seu-usuario`
- **GitHub Container Registry**: `ghcr.io/seu-usuario`
- **Google Container Registry**: `gcr.io/seu-projeto`
- **Amazon ECR**: `seu-account.dkr.ecr.regiao.amazonaws.com`
- **Azure Container Registry**: `seu-registry.azurecr.io`

## Pré-requisitos

1. Docker instalado e rodando
2. Conta no registry escolhido
3. Autenticado no registry:
   ```bash
   # Docker Hub
   docker login
   
   # GitHub Container Registry
   echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
   
   # Google Container Registry
   gcloud auth configure-docker
   
   # Amazon ECR
   aws ecr get-login-password --region regiao | docker login --username AWS --password-stdin seu-account.dkr.ecr.regiao.amazonaws.com
   ```

## Build e Push

### Linux/Mac

```bash
# Dar permissão de execução
chmod +x scripts/build-and-push.sh

# Build e push
./scripts/build-and-push.sh docker.io/seu-usuario v1.0.0
```

### Windows (PowerShell)

```powershell
.\scripts\build-and-push.ps1 -Registry "docker.io/seu-usuario" -Tag "v1.0.0"
```

### Manual

```bash
# Build backend
docker build -f Dockerfile.backend -t seu-registry/turbozap-backend:v1.0.0 .

# Build frontend
docker build -f Dockerfile.frontend -t seu-registry/turbozap-frontend:v1.0.0 .

# Push backend
docker push seu-registry/turbozap-backend:v1.0.0

# Push frontend
docker push seu-registry/turbozap-frontend:v1.0.0
```

## Deploy no EasyPanel usando Imagens Pré-buildadas

### Opção 1: Usar Imagem Docker (Recomendado)

1. Acesse o EasyPanel
2. Clique em "New App"
3. Selecione **"Docker Image"** (não "Dockerfile")
4. Configure:
   - **Name**: `turbozap-backend` ou `turbozap-frontend`
   - **Image**: `seu-registry/turbozap-backend:v1.0.0`
   - **Registry Credentials**: Se necessário, adicione credenciais do registry

### Opção 2: Usar Docker Compose com Imagens

Crie um arquivo `docker-compose.easypanel.yml`:

```yaml
version: '3.8'

services:
  backend:
    image: seu-registry/turbozap-backend:v1.0.0
    container_name: turbozap-backend
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - API_KEY=${API_KEY}
    restart: unless-stopped

  frontend:
    image: seu-registry/turbozap-frontend:v1.0.0
    container_name: turbozap-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    depends_on:
      - backend
    restart: unless-stopped
```

## Versionamento

Recomenda-se usar tags semânticas:

- `latest`: Última versão estável
- `v1.0.0`: Versão específica
- `v1.0.0-beta`: Versão beta
- `main`: Build da branch main
- `dev`: Build de desenvolvimento

### Exemplo de Workflow

```bash
# Build e push da versão
./scripts/build-and-push.sh docker.io/seu-usuario v1.0.0

# Também marcar como latest
docker tag seu-registry/turbozap-backend:v1.0.0 seu-registry/turbozap-backend:latest
docker tag seu-registry/turbozap-frontend:v1.0.0 seu-registry/turbozap-frontend:latest
docker push seu-registry/turbozap-backend:latest
docker push seu-registry/turbozap-frontend:latest
```

## GitHub Actions (CI/CD)

Crie `.github/workflows/build-and-push.yml`:

```yaml
name: Build and Push Docker Images

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./Dockerfile.backend
          push: true
          tags: |
            docker.io/${{ secrets.DOCKER_USERNAME }}/turbozap-backend:${{ github.ref_name }}
            docker.io/${{ secrets.DOCKER_USERNAME }}/turbozap-backend:latest
      
      - name: Build and push frontend
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./Dockerfile.frontend
          push: true
          tags: |
            docker.io/${{ secrets.DOCKER_USERNAME }}/turbozap-frontend:${{ github.ref_name }}
            docker.io/${{ secrets.DOCKER_USERNAME }}/turbozap-frontend:latest
```

## Segurança

### Registry Privado

Para manter o código completamente privado:

1. Use um registry privado (GitHub Container Registry privado, ECR, etc.)
2. Configure credenciais no EasyPanel
3. Use tags específicas ao invés de `latest`

### Secrets no EasyPanel

1. Vá em Settings → Secrets
2. Adicione as credenciais do registry:
   - `DOCKER_USERNAME`
   - `DOCKER_PASSWORD` ou `DOCKER_TOKEN`

## Troubleshooting

### Erro de autenticação

```bash
# Verifique se está autenticado
docker login seu-registry.com

# Teste o pull
docker pull seu-registry/turbozap-backend:latest
```

### Imagem não encontrada

- Verifique se o push foi concluído com sucesso
- Verifique se a tag está correta
- Verifique as permissões do registry

### Build falha

- Verifique se todas as dependências estão no `.dockerignore`
- Verifique os logs do build
- Certifique-se de que o contexto está correto

## Próximos Passos

1. Configure seu registry preferido
2. Faça build e push das imagens
3. Configure o EasyPanel para usar as imagens pré-buildadas
4. Configure CI/CD para automatizar o processo

