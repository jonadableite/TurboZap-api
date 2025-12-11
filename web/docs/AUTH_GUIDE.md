# TurboZap - Guia de Autenticação Better-Auth

Este documento descreve a implementação do sistema de autenticação usando Better-Auth no frontend Next.js do TurboZap.

## Sumário

1. [Visão Geral](#visão-geral)
2. [Estrutura de Arquivos](#estrutura-de-arquivos)
3. [Schema do Banco de Dados](#schema-do-banco-de-dados)
4. [Níveis de Acesso](#níveis-de-acesso)
5. [Uso nos Componentes](#uso-nos-componentes)
6. [Proteção de Rotas](#proteção-de-rotas)
7. [Executando Migrações](#executando-migrações)
8. [Extensões Futuras](#extensões-futuras)

---

## Visão Geral

O sistema de autenticação utiliza:

- **Better-Auth**: Framework de autenticação para TypeScript
- **Prisma**: ORM para PostgreSQL
- **Next.js Middleware**: Proteção de rotas no edge
- **Roles**: USER, DEVELOPER, ADMIN

As tabelas de autenticação usam o prefixo `auth_` para não conflitar com as tabelas existentes do backend Go.

---

## Estrutura de Arquivos

```
web/
├── prisma/
│   ├── schema.prisma          # Schema com modelos de auth + TurboZap
│   └── migrations/            # Migrações SQL
├── src/
│   ├── app/
│   │   ├── (auth)/            # Páginas de autenticação
│   │   │   ├── layout.tsx     # Layout específico para auth
│   │   │   ├── sign-in/       # Página de login
│   │   │   ├── sign-up/       # Página de cadastro
│   │   │   └── forgot-password/
│   │   └── api/
│   │       └── auth/
│   │           └── [...all]/  # API Route do Better-Auth
│   ├── components/
│   │   └── auth/
│   │       ├── UserMenu.tsx   # Menu dropdown do usuário
│   │       └── RequireAuth.tsx # Componente de proteção
│   ├── hooks/
│   │   └── useAuth.ts         # Hook de autenticação
│   ├── lib/
│   │   ├── auth.ts            # Config Better-Auth (server)
│   │   ├── auth-client.ts     # Config Better-Auth (client)
│   │   └── permissions.ts     # Definições de roles e permissões
│   └── middleware.ts          # Proteção de rotas Next.js
```

---

## Schema do Banco de Dados

### Tabelas de Autenticação (Better-Auth)

```sql
-- Usuários autenticados
auth_users (
  id, name, email, emailVerified, image, role,
  banned, banReason, banExpires, createdAt, updatedAt
)

-- Sessões ativas
auth_sessions (
  id, expiresAt, token, ipAddress, userAgent,
  impersonatedBy, userId, createdAt, updatedAt
)

-- Contas (OAuth providers + credentials)
auth_accounts (
  id, accountId, providerId, userId, password,
  accessToken, refreshToken, scope, createdAt, updatedAt
)

-- Verificações (email, reset password)
auth_verifications (
  id, identifier, value, expiresAt, createdAt, updatedAt
)
```

### Relacionamento User → Instance

```sql
-- Coluna adicionada à tabela instances
instances.user_id → auth_users.id (ON DELETE SET NULL)
```

Isso permite que cada instância do WhatsApp pertença a um usuário específico.

---

## Níveis de Acesso

### USER (Padrão)
- Gerenciar suas próprias instâncias
- Enviar/receber mensagens
- Configurar webhooks próprios
- Gerenciar API keys pessoais

### DEVELOPER
- Todas as permissões de USER
- Acesso a logs de atividade
- Configurações avançadas

### ADMIN
- Todas as permissões
- Gerenciar usuários
- Banir/desbanir usuários
- Impersonar usuários
- Alterar roles

---

## Uso nos Componentes

### Hook useAuth

```tsx
import { useAuth } from "@/hooks/useAuth";

function MyComponent() {
  const { 
    user,          // Dados do usuário atual
    isLoading,     // Estado de carregamento
    isAuthenticated,
    isAdmin,       // true se role === "ADMIN"
    isDeveloper,   // true se role === "DEVELOPER" ou "ADMIN"
    hasRole,       // (roles) => boolean
    logout,        // Função para fazer logout
  } = useAuth();

  if (isLoading) return <Spinner />;

  if (!isAuthenticated) {
    return <p>Faça login para continuar</p>;
  }

  return (
    <div>
      <p>Olá, {user.name}!</p>
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

### Componente RequireAuth

```tsx
import { RequireAuth } from "@/components/auth";

// Requer autenticação básica
<RequireAuth>
  <Dashboard />
</RequireAuth>

// Requer role específico
<RequireAuth roles="ADMIN">
  <AdminPanel />
</RequireAuth>

// Requer um de vários roles
<RequireAuth roles={["DEVELOPER", "ADMIN"]}>
  <DevTools />
</RequireAuth>
```

### UserMenu (Menu do Usuário)

```tsx
import { UserMenu } from "@/components/auth";

function Header() {
  return (
    <header>
      {/* ... outros elementos ... */}
      <UserMenu />
    </header>
  );
}
```

---

## Proteção de Rotas

### Middleware (Edge)

O middleware em `src/middleware.ts` protege rotas no edge:

```typescript
// Rotas públicas (não requerem autenticação)
const publicRoutes = ["/sign-in", "/sign-up", "/docs", ...];

// Rotas protegidas
const protectedRoutes = ["/", "/instances", "/settings"];

// Rotas admin
const adminRoutes = ["/admin", "/users"];
```

### Proteção Server-Side

Para verificar roles no servidor:

```typescript
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  // ...
}
```

---

## Executando Migrações

### Desenvolvimento Local

```bash
cd web

# 1. Configure o .env.local com DATABASE_URL
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/turbozap"

# 2. Execute a migração
npx prisma migrate dev

# 3. Gere o Prisma Client
npx prisma generate
```

### Produção

```bash
# Aplicar migrações em produção
npx prisma migrate deploy
```

### Sincronizar com DB Existente

Se o banco já existe e você quer aplicar apenas as tabelas de auth:

```bash
# Aplicar SQL manualmente ou via:
npx prisma db push
```

---

## Extensões Futuras

### 1. Social Login (OAuth)

```typescript
// Em auth.ts, adicionar providers:
import { google, github } from "better-auth/social-providers";

export const auth = betterAuth({
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  // ...
});
```

### 2. Two-Factor Authentication (2FA)

```typescript
import { twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    twoFactor({
      issuer: "TurboZap",
    }),
  ],
  // ...
});
```

### 3. Verificação de Email

1. Configurar serviço de email (SendGrid, Resend, etc.)
2. Habilitar `requireEmailVerification: true` no auth.ts
3. Implementar template de email

### 4. Rate Limiting Avançado

```typescript
export const auth = betterAuth({
  rateLimit: {
    storage: "redis",
    window: 60,
    max: 10,
    // Usar Redis para rate limiting distribuído
  },
  // ...
});
```

---

## Variáveis de Ambiente

```env
# .env.local
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
BETTER_AUTH_SECRET="seu-secret-seguro-32-chars-minimo"
BETTER_AUTH_URL="http://localhost:3000"

# Social Login (opcional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

---

## Troubleshooting

### Erro: "Session not found"

- Verifique se o cookie `turbozap.session_token` está sendo enviado
- Confirme que o `baseURL` no auth-client.ts está correto

### Erro: "CORS blocked"

- Adicione a origem em `trustedOrigins` no auth.ts

### Erro de migração

- Verifique se o banco está acessível
- Confirme que as tabelas existentes não conflitam

---

## Referências

- [Better-Auth Docs](https://www.better-auth.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

