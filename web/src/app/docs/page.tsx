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
            Veja como é simples criar sua primeira instância e enviar uma mensagem:
          </p>

          {/* Step 1: Create Instance */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </span>
              Criar uma instância
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

          {/* Step 2: Connect */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
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
          </div>

          {/* Step 3: Send Message */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                3
              </span>
              Enviar mensagem
            </h3>
            <Terminal title="Enviar texto" className="mb-4">
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
                {'"text": "Olá! Essa é minha primeira mensagem via TurboZap!"'}
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
