# Migrations

## Criar Tabela de Lembretes

Para criar a tabela de lembretes no banco de dados PostgreSQL, execute o seguinte comando:

```bash
# Usando psql
psql $DATABASE_URL -f create_reminders_table.sql

# Ou usando docker exec (se estiver usando Docker)
docker exec -i <container_name> psql -U <user> -d <database> < create_reminders_table.sql
```

### Estrutura da Tabela

A tabela `reminders` contém os seguintes campos:

- `id` (UUID): Identificador único do lembrete
- `title` (VARCHAR): Título do lembrete (obrigatório)
- `description` (TEXT): Descrição detalhada (opcional)
- `date` (VARCHAR): Data no formato "DD MMM" ou "DD - DD MMM" (obrigatório)
- `time` (VARCHAR): Hora no formato "HH:MM" (opcional)
- `location` (VARCHAR): Localização do evento (opcional)
- `tags` (TEXT[]): Array de tags (opcional)
- `recommended_level` (VARCHAR): Nível recomendado (opcional)
- `status` (VARCHAR): Status do lembrete ('active', 'finished', 'upcoming')
- `category` (VARCHAR): Categoria ('all', 'events', 'content', 'news', 'offers')
- `action_buttons` (JSONB): Botões de ação com labels e URLs (opcional)
- `created_at` (TIMESTAMP): Data de criação
- `updated_at` (TIMESTAMP): Data de atualização (atualizado automaticamente)
- `created_by` (UUID): ID do usuário que criou o lembrete (referência a users.id)

### Índices

A tabela possui índices para otimizar consultas:
- `idx_reminders_status`: Filtro por status
- `idx_reminders_category`: Filtro por categoria
- `idx_reminders_date`: Ordenação por data
- `idx_reminders_created_at`: Ordenação por data de criação

