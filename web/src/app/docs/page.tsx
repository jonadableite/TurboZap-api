"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import {
  Terminal,
  TypingAnimation,
  AnimatedSpan,
  CodeBlock,
} from "@/components/docs/terminal";
import { ShineBorder } from "@/components/ui";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Code2,
  Key,
  Lock,
  MessageCircle,
  Rocket,
  Send,
  Users,
  Webhook,
  Zap,
  QrCode,
  RefreshCw,
  Shield,
} from "lucide-react";

const tocItems = [
  { id: "o-que-e", title: "O que é a TurboZap API?", level: 2 },
  { id: "primeiros-passos", title: "Primeiros passos", level: 2 },
  { id: "instalacao", title: "Instalação rápida", level: 2 },
  { id: "recursos", title: "Recursos principais", level: 2 },
];

const features = [
  {
    icon: <MessageCircle className="h-5 w-5" />,
    title: "Multi-instância",
    description: "Gerencie múltiplas conexões WhatsApp simultaneamente.",
  },
  {
    icon: <Webhook className="h-5 w-5" />,
    title: "Webhooks em tempo real",
    description: "Receba notificações instantâneas sobre mensagens e eventos.",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Segurança",
    description: "API Keys seguras e autenticação robusta por instância.",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Alta performance",
    description: "Desenvolvido em Go para máxima performance e baixa latência.",
  },
];

export default function DocsPage() {
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 px-8 py-10 max-w-4xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <span>Introdução</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold tracking-tight mb-4">Comece aqui</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Integre o WhatsApp em minutos com a TurboZap API! 🚀
        </p>

        {/* Intro */}
        <div className="prose prose-gray dark:prose-invert max-w-none mb-12">
          <p className="text-lg leading-relaxed text-muted-foreground">
            Nesta documentação você encontrará tudo o que precisa para integrar
            com a TurboZap API. Desenvolvida em Go com a biblioteca whatsmeow,
            nossa API oferece alta performance, conexões estáveis e suporte
            completo para todas as funcionalidades do WhatsApp Web.
          </p>
        </div>

        {/* O que é */}
        <section id="o-que-e" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">O que é a TurboZap API?</h2>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>
              A TurboZap API é uma solução completa para integração com WhatsApp,
              desenvolvida com foco em:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Multi-instância:</strong> Gerencie múltiplos números em uma única API</li>
              <li><strong>Conexão via QR Code:</strong> Simples como o WhatsApp Web</li>
              <li><strong>Sessões persistentes:</strong> Reconexão automática após reinicialização</li>
              <li><strong>Webhooks:</strong> Receba eventos em tempo real</li>
              <li><strong>Mensagens interativas:</strong> Botões, listas, reações e mais</li>
              <li><strong>Grupos:</strong> Criação e gerenciamento completo</li>
            </ul>
            <p>
              Com a TurboZap, você pode começar a enviar mensagens em minutos,
              não em semanas.
            </p>
          </div>
        </section>

        {/* Primeiros passos */}
        <section id="primeiros-passos" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Primeiros passos</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/docs/autenticacao"
              className="group relative p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all overflow-hidden"
            >
              <ShineBorder shineColor={["#8257e5", "#04d361"]} duration={10} />
              <div className="flex items-start gap-4 relative z-10">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    Autenticação
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Aprenda a usar sua API Key para autenticação
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/docs/api/instances/create"
              className="group relative p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all overflow-hidden"
            >
              <ShineBorder shineColor={["#04d361", "#8257e5"]} duration={12} />
              <div className="flex items-start gap-4 relative z-10">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <QrCode className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    Criar uma instância
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Sua primeira conexão em 5 minutos
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/docs/webhooks"
              className="group relative p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all overflow-hidden"
            >
              <ShineBorder shineColor={["#fba94c", "#8257e5"]} duration={14} />
              <div className="flex items-start gap-4 relative z-10">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Webhook className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    Configurar Webhooks
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações em tempo real
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/docs/api/messages/text"
              className="group relative p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all overflow-hidden"
            >
              <ShineBorder shineColor={["#81d8f7", "#8257e5"]} duration={16} />
              <div className="flex items-start gap-4 relative z-10">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    Enviar primeira mensagem
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Envie texto, imagens e muito mais
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Instalação rápida */}
        <section id="instalacao" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Code2 className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Instalação rápida</h2>
          </div>

          <p className="text-muted-foreground mb-6">
            Siga este guia passo a passo para configurar e executar a TurboZap API em minutos:
          </p>

          {/* Step 1: Requisitos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </span>
              Requisitos do sistema
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Certifique-se de ter instalado:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><strong>Docker</strong> 20.10+ e <strong>Docker Compose</strong> 2.0+ (recomendado)</li>
                <li>Ou <strong>Go</strong> 1.22+ para desenvolvimento local</li>
                <li><strong>PostgreSQL</strong> 16+ (se rodar localmente)</li>
                <li><strong>Redis</strong> 7+ (se rodar localmente)</li>
                <li><strong>RabbitMQ</strong> 3.13+ (se rodar localmente)</li>
              </ul>
            </div>
          </div>

          {/* Step 2: Clonar repositório */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </span>
              Clonar o repositório
            </h3>
            <Terminal title="Clonar repositório" className="mb-4">
              <TypingAnimation className="text-gray-400">
                {"$ git clone https://github.com/jonadableite/turbozap-api.git"}
              </TypingAnimation>
              <AnimatedSpan className="text-gray-400 mt-2">
                {"$ cd turbozap-api"}
              </AnimatedSpan>
              <AnimatedSpan className="text-green-500 mt-4">
                ✔ Repositório clonado com sucesso!
              </AnimatedSpan>
            </Terminal>
          </div>

          {/* Step 3: Configurar ambiente */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                3
              </span>
              Configurar variáveis de ambiente
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Crie um arquivo <code className="px-1.5 py-0.5 rounded bg-muted text-xs">.env</code> na raiz do projeto:
            </p>
            <CodeBlock
              title=".env"
              language="bash"
              code={`# API Configuration
SERVER_PORT=8080
SERVER_HOST=0.0.0.0
API_KEY=sua-api-key-global-segura-aqui

# Database
DATABASE_URL=postgres://postgres:postgres@postgres:5432/turbozap?sslmode=disable

# Redis
REDIS_URL=redis://redis:6379

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/

# MinIO (opcional)
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=turbozap-media
MINIO_USE_SSL=false

# Logging
LOG_LEVEL=info
ENVIRONMENT=production`}
            />
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-3">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                <strong>⚠️ Importante:</strong> Altere o <code className="px-1 py-0.5 rounded bg-yellow-500/20 text-xs">API_KEY</code> para uma chave segura antes de usar em produção!
              </p>
            </div>
          </div>

          {/* Step 4: Rodar com Docker Compose */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                4
              </span>
              Executar com Docker Compose (Recomendado)
            </h3>
            <Terminal title="Iniciar serviços" className="mb-4">
              <TypingAnimation className="text-gray-400">
                {"$ docker-compose up -d"}
              </TypingAnimation>
              <AnimatedSpan className="text-green-500 mt-4">
                ✔ Todos os serviços iniciados!
              </AnimatedSpan>
            </Terminal>
            <p className="text-sm text-muted-foreground mb-3">
              Isso iniciará todos os serviços necessários:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4 mb-4">
              <li>TurboZap API na porta <code className="px-1 py-0.5 rounded bg-muted text-xs">8080</code></li>
              <li>PostgreSQL na porta <code className="px-1 py-0.5 rounded bg-muted text-xs">5432</code></li>
              <li>Redis na porta <code className="px-1 py-0.5 rounded bg-muted text-xs">6379</code></li>
              <li>RabbitMQ Management na porta <code className="px-1 py-0.5 rounded bg-muted text-xs">15672</code></li>
              <li>MinIO Console na porta <code className="px-1 py-0.5 rounded bg-muted text-xs">9001</code></li>
              <li>Grafana na porta <code className="px-1 py-0.5 rounded bg-muted text-xs">3000</code></li>
            </ul>
            <Terminal title="Verificar logs" className="mb-4">
              <TypingAnimation className="text-gray-400">
                {"$ docker-compose logs -f turbozap"}
              </TypingAnimation>
            </Terminal>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-3">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                <strong>💡 Dica:</strong> Acesse <code className="px-1 py-0.5 rounded bg-blue-500/20 text-xs">http://localhost:8080/health</code> para verificar se a API está rodando.
              </p>
            </div>
          </div>

          {/* Step 5: Desenvolvimento Local (Alternativa) */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                5
              </span>
              Desenvolvimento Local (Alternativa)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Se preferir rodar localmente sem Docker:
            </p>
            <Terminal title="Instalar dependências" className="mb-4">
              <TypingAnimation className="text-gray-400">
                {"$ go mod download"}
              </TypingAnimation>
              <AnimatedSpan className="text-green-500 mt-4">
                ✔ Dependências instaladas!
              </AnimatedSpan>
            </Terminal>
            <Terminal title="Configurar variáveis" className="mb-4">
              <TypingAnimation className="text-gray-400">
                {"$ export DATABASE_URL=\"postgres://postgres:postgres@localhost:5432/turbozap?sslmode=disable\""}
              </TypingAnimation>
              <AnimatedSpan className="text-gray-400 mt-2">
                {"$ export REDIS_URL=\"redis://localhost:6379\""}
              </AnimatedSpan>
              <AnimatedSpan className="text-gray-400 mt-2">
                {"$ export RABBITMQ_URL=\"amqp://guest:guest@localhost:5672/\""}
              </AnimatedSpan>
              <AnimatedSpan className="text-gray-400 mt-2">
                {"$ export API_KEY=\"sua-api-key-global\""}
              </AnimatedSpan>
            </Terminal>
            <Terminal title="Executar API" className="mb-4">
              <TypingAnimation className="text-gray-400">
                {"$ go run ./cmd/api"}
              </TypingAnimation>
              <AnimatedSpan className="text-green-500 mt-4">
                ✔ API rodando em http://localhost:8080
              </AnimatedSpan>
            </Terminal>
          </div>

          {/* Step 6: Criar primeira instância */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                6
              </span>
              Criar sua primeira instância
            </h3>
            <Terminal title="Criar instância" className="mb-4">
              <TypingAnimation className="text-gray-400">
                {"$ curl --request POST \\"}
              </TypingAnimation>
              <AnimatedSpan className="text-blue-400 pl-4">
                {"--url http://localhost:8080/instance/create \\"}
              </AnimatedSpan>
              <AnimatedSpan className="text-blue-400 pl-4">
                {"--header 'X-API-Key: sua-api-key-global' \\"}
              </AnimatedSpan>
              <AnimatedSpan className="text-blue-400 pl-4">
                {"--header 'Content-Type: application/json' \\"}
              </AnimatedSpan>
              <AnimatedSpan className="text-blue-400 pl-4">
                {"--data '{\"name\": \"minha-instancia\"}'"}
              </AnimatedSpan>
              <AnimatedSpan className="text-green-500 mt-4">
                ✔ Instância criada com sucesso!
              </AnimatedSpan>
            </Terminal>
            <CodeBlock
              title="Resposta"
              language="json"
              code={`{
  "success": true,
  "data": {
    "instance": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "minha-instancia",
      "api_key": "unique-api-key-for-this-instance",
      "status": "disconnected",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}`}
            />
          </div>

          {/* Step 7: Conectar via QR Code */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                7
              </span>
              Conectar via QR Code
            </h3>
            <Terminal title="Obter QR Code" className="mb-4">
              <TypingAnimation className="text-gray-400">
                {"$ curl --request POST \\"}
              </TypingAnimation>
              <AnimatedSpan className="text-blue-400 pl-4">
                {"--url http://localhost:8080/instance/minha-instancia/connect \\"}
              </AnimatedSpan>
              <AnimatedSpan className="text-blue-400 pl-4">
                {"--header 'X-API-Key: unique-api-key-for-this-instance'"}
              </AnimatedSpan>
              <AnimatedSpan className="text-green-500 mt-4">
                ✔ Escaneie o QR Code no WhatsApp!
              </AnimatedSpan>
            </Terminal>
            <p className="text-sm text-muted-foreground mb-3">
              A resposta conterá um QR Code em base64. Você pode visualizá-lo ou usar o endpoint <code className="px-1.5 py-0.5 rounded bg-muted text-xs">GET /instance/:name/qrcode</code> para obter a imagem diretamente.
            </p>
          </div>

          {/* Step 8: Enviar primeira mensagem */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                8
              </span>
              Enviar sua primeira mensagem
            </h3>
            <Terminal title="Enviar mensagem de texto" className="mb-4">
              <TypingAnimation className="text-gray-400">
                {"$ curl --request POST \\"}
              </TypingAnimation>
              <AnimatedSpan className="text-blue-400 pl-4">
                {"--url http://localhost:8080/message/minha-instancia/text \\"}
              </AnimatedSpan>
              <AnimatedSpan className="text-blue-400 pl-4">
                {"--header 'X-API-Key: unique-api-key-for-this-instance' \\"}
              </AnimatedSpan>
              <AnimatedSpan className="text-blue-400 pl-4">
                {"--header 'Content-Type: application/json' \\"}
              </AnimatedSpan>
              <AnimatedSpan className="text-blue-400 pl-4">
                {"--data '{"}
              </AnimatedSpan>
              <AnimatedSpan className="text-green-400 pl-8">
                {'"to": "5511999999999",'}
              </AnimatedSpan>
              <AnimatedSpan className="text-green-400 pl-8">
                {'"text": "Olá! Essa é minha primeira mensagem via TurboZap! 🚀"'}
              </AnimatedSpan>
              <AnimatedSpan className="text-blue-400 pl-4">
                {"}'"}
              </AnimatedSpan>
              <AnimatedSpan className="text-green-500 mt-4">
                ✔ Mensagem enviada com sucesso!
              </AnimatedSpan>
            </Terminal>
            <CodeBlock
              title="Resposta"
              language="json"
              code={`{
  "success": true,
  "data": {
    "message_id": "3EB0A1B2C3D4E5F6",
    "status": "sent",
    "timestamp": "2024-01-15T10:35:00.000Z"
  }
}`}
            />
          </div>

          {/* Próximos passos */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">🎉 Pronto! E agora?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Você já tem a API rodando! Explore os próximos passos:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span>Configure <Link href="/docs/webhooks" className="text-primary hover:underline">webhooks</Link> para receber eventos em tempo real</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span>Explore a <Link href="/docs/api" className="text-primary hover:underline">documentação completa da API</Link></span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span>Envie <Link href="/docs/api/messages" className="text-primary hover:underline">mídias, botões e listas</Link></span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span>Acesse o <Link href="/instances" className="text-primary hover:underline">Dashboard</Link> para gerenciar suas instâncias</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Recursos */}
        <section id="recursos" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Recursos principais</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {features.map((feature, index) => (
              <div
                key={index}
                className="relative p-6 rounded-xl border border-border bg-card overflow-hidden"
              >
                <ShineBorder 
                  shineColor={["#8257e5", "#996dff"]} 
                  duration={14 + index * 2} 
                  borderWidth={1}
                />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="p-8 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Pronto para começar?</h3>
              <p className="text-muted-foreground">
                Crie sua primeira instância e comece a enviar mensagens agora.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/docs/api/instances"
                className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-accent transition-colors text-sm font-medium"
              >
                Ver documentação
              </Link>
              <Link
                href="/instances"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2"
              >
                Ir para Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <OnThisPage items={tocItems} />
    </div>
  );
}
