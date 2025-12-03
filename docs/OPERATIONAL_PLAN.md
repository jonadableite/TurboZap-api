# Plano Operacional - TurboZap API

Este documento descreve procedimentos operacionais para manter a TurboZap API em produção.

## 1. Monitoramento

### 1.1 Métricas Principais

| Métrica | Descrição | Threshold de Alerta |
|---------|-----------|---------------------|
| `turbozap_instances_active` | Instâncias conectadas | < esperado |
| `turbozap_messages_sent_total` | Total de mensagens enviadas | Taxa anormal |
| `turbozap_messages_failed_total` | Mensagens com falha | > 5% |
| `turbozap_http_requests_duration_seconds` | Latência HTTP | P99 > 2s |
| `turbozap_queue_messages_pending` | Mensagens na fila | > 1000 |

### 1.2 Alertas Críticos

```yaml
# Exemplo de regras Prometheus
groups:
  - name: turbozap
    rules:
      - alert: TurboZapHighErrorRate
        expr: rate(turbozap_messages_failed_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Alta taxa de erros no TurboZap"

      - alert: TurboZapInstanceDisconnected
        expr: turbozap_instances_active < turbozap_instances_expected
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Instância desconectada"

      - alert: TurboZapQueueBacklog
        expr: turbozap_queue_messages_pending > 1000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Fila de mensagens acumulada"
```

### 1.3 Dashboards Grafana

**Dashboard Principal:**
- Instâncias ativas vs configuradas
- Taxa de mensagens enviadas/recebidas (5min)
- Taxa de erros (5min)
- Latência P50/P95/P99
- Tamanho da fila RabbitMQ
- Uso de memória/CPU

**Dashboard de Instância:**
- Status de conexão
- Mensagens por tipo
- Eventos de webhook
- Erros por tipo

## 2. Procedimentos de Reautenticação

### 2.1 Quando Reautenticar

- Sessão expirada (logout automático)
- Bloqueio por atividade suspeita
- Atualização do WhatsApp Web
- Após 14 dias sem atividade

### 2.2 Playbook de Reautenticação

```bash
#!/bin/bash
# reauth-instance.sh

INSTANCE_NAME=$1
API_URL="http://localhost:8080"
API_KEY="your-api-key"

echo "🔄 Iniciando reautenticação de ${INSTANCE_NAME}..."

# 1. Verificar status atual
STATUS=$(curl -s -H "X-API-Key: ${API_KEY}" \
  "${API_URL}/instance/${INSTANCE_NAME}/status" | jq -r '.data.status')

echo "📊 Status atual: ${STATUS}"

# 2. Se desconectado, tentar reconectar
if [ "$STATUS" != "connected" ]; then
  echo "🔌 Tentando conectar..."
  curl -X POST -H "X-API-Key: ${API_KEY}" \
    "${API_URL}/instance/${INSTANCE_NAME}/connect"
  
  sleep 5
  
  # 3. Obter QR code
  echo "📱 Obtendo QR code..."
  QR=$(curl -s -H "X-API-Key: ${API_KEY}" \
    "${API_URL}/instance/${INSTANCE_NAME}/qrcode" | jq -r '.data.qrcode')
  
  if [ "$QR" != "null" ]; then
    echo "✅ QR Code gerado. Escaneie no WhatsApp."
    echo "$QR" | qrencode -t UTF8
  else
    echo "ℹ️ Verificando se já conectou..."
    sleep 10
    STATUS=$(curl -s -H "X-API-Key: ${API_KEY}" \
      "${API_URL}/instance/${INSTANCE_NAME}/status" | jq -r '.data.status')
    
    if [ "$STATUS" == "connected" ]; then
      echo "✅ Conectado com sucesso!"
    else
      echo "❌ Falha na conexão. Verifique os logs."
      exit 1
    fi
  fi
else
  echo "✅ Instância já conectada!"
fi
```

### 2.3 Automação de Reconexão

O sistema tenta reconectar automaticamente quando:
- Detecta desconexão temporária
- Configuração `WHATSAPP_AUTO_RECONNECT=true`

Para desabilitar (útil em manutenção):
```bash
export WHATSAPP_AUTO_RECONNECT=false
```

## 3. Backup e Recovery

### 3.1 Dados Críticos

| Dado | Localização | Backup |
|------|-------------|--------|
| Sessões WhatsApp | PostgreSQL (`whatsmeow_*`) | pg_dump diário |
| Configurações | PostgreSQL (`instances`, `webhooks`) | pg_dump diário |
| Mídia | MinIO | Sync S3 |
| Mensagens | PostgreSQL (`messages`) | pg_dump (opcional) |

### 3.2 Script de Backup

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/turbozap"
DATE=$(date +%Y%m%d_%H%M%S)
DB_URL="postgres://postgres:postgres@localhost:5432/turbozap"

mkdir -p ${BACKUP_DIR}

# Backup PostgreSQL
echo "📦 Backup do PostgreSQL..."
pg_dump ${DB_URL} | gzip > ${BACKUP_DIR}/db_${DATE}.sql.gz

# Backup configurações (sem dados sensíveis)
echo "📄 Backup de configurações..."
cp .env ${BACKUP_DIR}/env_${DATE}.bak

# Limpar backups antigos (manter 7 dias)
find ${BACKUP_DIR} -name "*.gz" -mtime +7 -delete

echo "✅ Backup concluído: ${BACKUP_DIR}"
```

### 3.3 Procedimento de Recovery

```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1
DB_URL="postgres://postgres:postgres@localhost:5432/turbozap"

echo "🔄 Restaurando backup: ${BACKUP_FILE}"

# 1. Parar a API
docker-compose stop turbozap

# 2. Restaurar banco
gunzip -c ${BACKUP_FILE} | psql ${DB_URL}

# 3. Reiniciar API
docker-compose start turbozap

# 4. Verificar instâncias
sleep 10
curl -H "X-API-Key: your-api-key" http://localhost:8080/instance/list

echo "✅ Restore concluído!"
```

## 4. Scaling

### 4.1 Horizontal Scaling

```yaml
# docker-compose.scale.yml
services:
  turbozap:
    deploy:
      replicas: 3
    environment:
      - RABBITMQ_WORKER_COUNT=4

  worker:
    image: turbozap-api
    command: ["./turbozap", "worker"]
    deploy:
      replicas: 5
```

### 4.2 Limites Recomendados

| Instâncias | RAM | CPU | Workers |
|------------|-----|-----|---------|
| 1-10 | 2GB | 2 cores | 2 |
| 10-50 | 4GB | 4 cores | 4 |
| 50-100 | 8GB | 8 cores | 8 |
| 100+ | 16GB+ | 16 cores+ | 16+ |

### 4.3 Rate Limiting

Configuração padrão em Redis:
```
REDIS_RATE_LIMIT_RPM=60  # Requisições por minuto por instância
```

## 5. Troubleshooting

### 5.1 Problemas Comuns

#### Instância não conecta
```bash
# Verificar logs
docker-compose logs turbozap | grep -i "instance-name"

# Possíveis causas:
# - QR code expirado (gerar novo)
# - Número bloqueado pelo WhatsApp
# - Conflito de sessão (logout e reconectar)
```

#### Mensagens não enviadas
```bash
# Verificar fila RabbitMQ
curl -u guest:guest http://localhost:15672/api/queues

# Verificar status da instância
curl -H "X-API-Key: key" http://localhost:8080/instance/NAME/status

# Verificar logs de erro
docker-compose logs turbozap | grep -i error
```

#### Alta latência
```bash
# Verificar uso de recursos
docker stats

# Verificar conexão com banco
docker-compose exec postgres pg_isready

# Verificar fila de mensagens
curl -u guest:guest http://localhost:15672/api/queues/%2F/whatsapp.send.messages
```

### 5.2 Comandos Úteis

```bash
# Status geral
curl http://localhost:8080/health

# Métricas
curl http://localhost:8080/metrics

# Logs em tempo real
docker-compose logs -f turbozap

# Reiniciar apenas a API
docker-compose restart turbozap

# Limpar fila de mensagens
curl -X DELETE -u guest:guest \
  http://localhost:15672/api/queues/%2F/whatsapp.send.messages/contents
```

## 6. Segurança

### 6.1 Checklist de Produção

- [ ] API_KEY forte e única
- [ ] TLS/HTTPS configurado
- [ ] Firewall restringindo portas
- [ ] Secrets em variáveis de ambiente
- [ ] Logs sem dados sensíveis
- [ ] Backup de sessões criptografado
- [ ] Rate limiting ativo
- [ ] CORS restrito a domínios permitidos

### 6.2 Rotação de Credenciais

```bash
# Gerar nova API key
NEW_KEY=$(openssl rand -hex 32)

# Atualizar .env
sed -i "s/API_KEY=.*/API_KEY=${NEW_KEY}/" .env

# Reiniciar
docker-compose restart turbozap

# Notificar clientes sobre nova key
```

## 7. Contatos de Emergência

| Situação | Ação | Contato |
|----------|------|---------|
| API indisponível | Verificar containers/logs | DevOps Team |
| Instância bloqueada | Criar nova instância | WhatsApp Support |
| Vazamento de dados | Rotação de secrets | Security Team |
| Alta carga | Escalar workers | DevOps Team |

---

**Última atualização**: Dezembro 2024
**Versão**: 1.0.0

