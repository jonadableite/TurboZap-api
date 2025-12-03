# TurboZap Panel 🚀

Painel de administração para a API TurboZap - Gerencie suas instâncias WhatsApp com facilidade.

![TurboZap Panel](https://img.shields.io/badge/TurboZap-Panel-8257e5?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=for-the-badge&logo=tailwindcss)

## 📸 Screenshots

### Dashboard
- Visão geral das instâncias
- Estatísticas em tempo real
- Ações rápidas

### Instâncias
- Listagem de todas as instâncias
- Status em tempo real
- QR Code para conexão

## 🎨 Design System

O painel utiliza a **paleta de cores**:

| Cor | Hex | Uso |
|-----|-----|-----|
| Purple | `#8257e5` | Cor primária, botões principais |
| Green | `#04d361` | Sucesso, conectado |
| Background | `#09090a` | Fundo principal |
| Card | `#121214` | Cards e painéis |
| Gray | `#e1e1e6` | Texto principal |

## ✨ Features

- ✅ **Dashboard** - Visão geral com estatísticas
- ✅ **Criar Instância** - Crie novas conexões WhatsApp
- ✅ **QR Code** - Visualize e escaneie QR Codes
- ✅ **Status em Tempo Real** - Atualizações automáticas
- ✅ **Gerenciar Instâncias** - Conectar, reiniciar, desconectar, excluir
- ✅ **Tema Dark** - Interface elegante e moderna
- ✅ **Animações** - Transições suaves com Framer Motion
- ✅ **Responsivo** - Funciona em desktop e mobile
- ✅ **Type-Safe** - TypeScript em todo o projeto

## 🛠️ Tecnologias

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Animações**: [Framer Motion](https://www.framer.com/motion/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **QR Code**: [qrcode.react](https://github.com/zpao/qrcode.react)

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- API TurboZap rodando (`go run ./cmd/api`)

### Passos

1. **Entre na pasta do painel**:
   ```bash
   cd web
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure o ambiente**:
   ```bash
   # Crie o arquivo de configuração (já criado por padrão)
   # .env.local contém:
   # NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

4. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

5. **Acesse o painel**:
   ```
   http://localhost:3000
   ```

## 📝 Scripts

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar produção
npm run start

# Lint
npm run lint
```

## 🔧 Configuração

### API Key

1. Clique no botão "API Key configurada" ou "Configurar API Key" no header
2. Insira a mesma API Key definida no `.env` da API (`API_KEY`)
3. Salve a configuração

### URL da API

Por padrão, o painel conecta em `http://localhost:8080`. Para alterar:

1. Edite o arquivo `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://seu-servidor:8080
   ```

2. Ou configure na página de **Configurações**

## 📁 Estrutura do Projeto

```
web/
├── src/
│   ├── app/                    # App Router (páginas)
│   │   ├── page.tsx            # Dashboard
│   │   ├── instances/          # Página de instâncias
│   │   ├── settings/           # Configurações
│   │   └── docs/               # Documentação
│   ├── components/
│   │   ├── ui/                 # Componentes base (Button, Card, etc.)
│   │   ├── layout/             # Layout (Sidebar, Header)
│   │   └── instances/          # Componentes de instância
│   ├── hooks/                  # React hooks customizados
│   ├── lib/                    # Utilitários e API client
│   └── types/                  # TypeScript types
├── public/                     # Assets estáticos
└── package.json
```

## 🎯 Uso

### Criar uma Instância

1. Clique em "Nova instância" no dashboard ou página de instâncias
2. Digite um nome (ex: "minha-empresa")
3. Clique em "Criar instância"
4. Escaneie o QR Code com o WhatsApp do seu celular

### Conectar uma Instância

1. Na lista de instâncias, clique em "Conectar" na instância desejada
2. Escaneie o QR Code
3. Aguarde a conexão ser estabelecida

### Gerenciar Instâncias

- **Reiniciar**: Menu ⋮ → Reiniciar
- **Desconectar**: Menu ⋮ → Desconectar (apenas instâncias conectadas)
- **Excluir**: Menu ⋮ → Excluir

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto faz parte do TurboZap API.

---

Desenvolvido com 💜
