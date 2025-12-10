# Scripts de Setup do Banco de Dados

Este diretório contém scripts para gerenciar o banco de dados do TurboZap.

## Scripts Disponíveis

### 1. `create_db.go`
**Propósito**: Criar apenas o banco de dados PostgreSQL (se não existir).

**Uso**:
```bash
go run scripts/create_db.go
```

**O que faz**:
- Conecta ao PostgreSQL
- Verifica se o banco `turbozap` existe
- Cria o banco se não existir

---

### 2. `setup_db.go` ⭐ **RECOMENDADO**
**Propósito**: Setup completo do banco de dados (criar banco + migrations + seed).

**Uso**:
```bash
go run scripts/setup_db.go
```

**O que faz**:
1. ✅ Cria o banco de dados se não existir
2. ✅ Aplica todas as migrations do backend Go:
   - Tabelas: `instances`, `webhooks`, `messages`
   - Tabelas do whatsmeow (10 tabelas)
   - Índices e constraints
3. ✅ Tenta aplicar migrations do Better Auth (opcional)
4. ✅ Executa seed para popular dados iniciais (se necessário)

**Características**:
- ✅ **Idempotente**: Pode rodar múltiplas vezes sem problemas
- ✅ **Seguro**: Não deleta dados existentes
- ✅ **Incremental**: Aplica apenas migrations novas

---

### 3. `seed.go`
**Propósito**: Popular o banco com dados iniciais.

**Uso**:
```bash
go run scripts/seed.go
```

**O que faz**:
- Verifica dados existentes
- Popula dados iniciais se necessário (idempotente)
- Por padrão, apenas verifica o status (não cria dados automaticamente)

---

## Uso no Docker

O `Dockerfile` está configurado para executar automaticamente o `setup_db.go` antes de iniciar os serviços:

1. **Build**: Compila `setup_db` e `seed_db` durante o build
2. **Startup**: Executa `setup_db` no início do container
3. **Resultado**: Banco criado, migrations aplicadas, seed executado

### Variáveis de Ambiente Necessárias

```bash
DATABASE_URL=postgres://user:password@host:port/database?sslmode=disable
```

---

## Migrations

### Backend Go (aplicadas automaticamente)

As migrations são versionadas e aplicadas incrementalmente:

| Versão | Descrição |
|--------|-----------|
| 1 | Cria tabela `instances` |
| 2 | Cria tabela `webhooks` |
| 3 | Cria tabela `messages` |
| 4 | Cria tabelas do whatsmeow (10 tabelas) |
| 5 | Adiciona coluna `device_jid` em `instances` |
| 6 | Adiciona opções de webhook (`webhook_by_events`, `webhook_base64`) |

### Better Auth (opcional)

As tabelas do Better Auth são criadas automaticamente pelo Next.js na primeira execução:
- `auth_users`
- `auth_sessions`
- `auth_accounts`
- `auth_verifications`

Ou podem ser criadas manualmente via CLI:
```bash
cd web
npx @better-auth/cli migrate
```

---

## Estrutura das Tabelas

### Tabelas do Backend
- `instances` - Instâncias WhatsApp
- `webhooks` - Configurações de webhooks
- `messages` - Mensagens enviadas/recebidas
- `schema_migrations` - Controle de versões das migrations

### Tabelas do Whatsmeow (10 tabelas)
- `whatsmeow_device`
- `whatsmeow_identity_keys`
- `whatsmeow_pre_keys`
- `whatsmeow_sessions`
- `whatsmeow_sender_keys`
- `whatsmeow_app_state_sync_keys`
- `whatsmeow_app_state_version`
- `whatsmeow_app_state_mutation_macs`
- `whatsmeow_contacts`
- `whatsmeow_chat_settings`

### Tabelas do Better Auth (4 tabelas)
- `auth_users`
- `auth_sessions`
- `auth_accounts`
- `auth_verifications`

---

## Troubleshooting

### Erro: "DATABASE_URL não encontrada"
- Verifique se a variável está definida no `.env` ou no ambiente

### Erro: "Erro ao conectar ao PostgreSQL"
- Verifique se o PostgreSQL está rodando
- Verifique se as credenciais estão corretas
- Verifique se o host/port estão acessíveis

### Erro: "Better Auth CLI não encontrado"
- Isso é normal se Node.js não estiver disponível
- As tabelas do Better Auth serão criadas automaticamente pelo Next.js

### Migrations não aplicadas
- Verifique a tabela `schema_migrations` para ver quais foram aplicadas
- Execute `setup_db.go` novamente (é idempotente)

---

## Exemplo de Uso Completo

```bash
# 1. Configurar variáveis de ambiente
export DATABASE_URL="postgres://user:pass@localhost:5432/turbozap?sslmode=disable"

# 2. Executar setup completo
go run scripts/setup_db.go

# 3. Verificar resultado
psql $DATABASE_URL -c "\dt"  # Listar tabelas
```

---

## Notas Importantes

⚠️ **IMPORTANTE**: 
- O `setup_db.go` é **idempotente** e **seguro**
- Não deleta dados existentes
- Aplica apenas migrations novas
- Pode ser executado múltiplas vezes sem problemas

✅ **Recomendado**: Use `setup_db.go` para setup completo em produção.

