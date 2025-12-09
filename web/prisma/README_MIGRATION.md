# Guia de Migração de Autenticação

## Status Atual

A migração `20250108000000_init_auth` foi marcada como aplicada no Prisma. Isso significa que o Prisma reconhece que as tabelas de autenticação devem existir no banco.

## Verificar se as Tabelas Existem

Execute no PostgreSQL:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'auth_%'
ORDER BY table_name;
```

Você deve ver:
- `auth_users`
- `auth_sessions`
- `auth_accounts`
- `auth_verifications`
- `api_keys`
- `activity_logs`

## Se as Tabelas NÃO Existem

Execute o script SQL manualmente:

```bash
# Opção 1: Via psql
psql "postgres://postgres:c4102143751b6e25d238@painel.whatlead.com.br:5436/turbozap?sslmode=disable" -f prisma/apply-auth-migration.sql

# Opção 2: Via cliente PostgreSQL (pgAdmin, DBeaver, etc.)
# Abra o arquivo prisma/apply-auth-migration.sql e execute no banco
```

## Verificar Coluna user_id na Tabela instances

```sql
-- Verificar se a coluna existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'instances' 
AND column_name = 'user_id';

-- Se não existir, execute:
ALTER TABLE instances ADD COLUMN IF NOT EXISTS user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_instances_user_id ON instances(user_id);
```

## Próximos Passos

1. ✅ Migração marcada como aplicada
2. ✅ Prisma Client gerado
3. ⚠️ Verificar se tabelas existem no banco
4. ⚠️ Se não existirem, executar `apply-auth-migration.sql`
5. ✅ Testar autenticação no frontend

## Comandos Úteis

```bash
# Regenerar Prisma Client
npx --yes -p node@20 -p prisma -p @prisma/client prisma generate

# Verificar status das migrações
npx --yes -p node@20 -p prisma -p @prisma/client prisma migrate status

# Aplicar migrações pendentes (se houver)
npx --yes -p node@20 -p prisma -p @prisma/client prisma migrate deploy
```

## Troubleshooting

### Erro: "Table already exists"
- Normal, significa que a tabela já foi criada
- O script usa `CREATE TABLE IF NOT EXISTS` para evitar erros

### Erro: "Constraint already exists"
- Normal, significa que a constraint já foi criada
- O script usa `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null END $$;` para evitar erros

### Erro: "Column already exists"
- Normal, significa que a coluna `user_id` já existe na tabela `instances`
- O script usa `ADD COLUMN IF NOT EXISTS` para evitar erros

