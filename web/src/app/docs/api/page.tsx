"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { CodeBlock, ApiEndpoint } from "@/components/docs/terminal";
import { ShineBorder } from "@/components/ui";
import { Code2, Server, Zap, Shield, Globe } from "lucide-react";
import Link from "next/link";

const tocItems = [
  { id: "introducao", title: "Introdução", level: 2 },
  { id: "base-url", title: "URL Base", level: 2 },
  { id: "autenticacao", title: "Autenticação", level: 2 },
  { id: "respostas", title: "Formato de respostas", level: 2 },
  { id: "recursos", title: "Recursos da API", level: 2 },
];

const resources = [
  { name: "Instâncias", description: "Criar, gerenciar e conectar números WhatsApp", href: "/docs/api/instances" },
  { name: "Mensagens", description: "Enviar texto, mídia, botões e mais", href: "/docs/api/messages" },
  { name: "Grupos", description: "Criar e gerenciar grupos", href: "/docs/api/groups" },
  { name: "Contatos", description: "Verificar números e obter informações", href: "/docs/api/contacts" },
  { name: "Presença", description: "Definir status online/offline", href: "/docs/api/presence" },
  { name: "Webhooks", description: "Configurar notificações em tempo real", href: "/docs/webhooks" },
];

export default function ApiReferencePage() {
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 px-8 py-10 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <span>Referência da API</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">Referência da API</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Documentação completa de todos os endpoints da TurboZap API
        </p>

        {/* Introdução */}
        <section id="introducao" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Code2 className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Introdução</h2>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>
              A TurboZap API é uma API RESTful que permite integração completa 
              com o WhatsApp. Todas as requisições e respostas utilizam JSON.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-foreground">Alta Performance</h4>
                </div>
                <p className="text-sm">Desenvolvida em Go para máxima velocidade</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-foreground">Segura</h4>
                </div>
                <p className="text-sm">Autenticação via API Key por instância</p>
              </div>
            </div>
          </div>
        </section>

        {/* Base URL */}
        <section id="base-url" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">URL Base</h2>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card">
            <code className="text-lg text-primary">
              http://localhost:8080
            </code>
          </div>

          <p className="text-muted-foreground mt-4">
            Em produção, substitua pelo seu domínio com HTTPS habilitado.
          </p>
        </section>

        {/* Autenticação */}
        <section id="autenticacao" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Autenticação</h2>
          </div>

          <p className="text-muted-foreground mb-4">
            Todas as requisições devem incluir a API Key no header:
          </p>

          <CodeBlock
            title="Header de autenticação"
            language="http"
            code={`X-API-Key: sua-api-key-aqui

# Ou alternativamente:
Authorization: Bearer sua-api-key-aqui`}
          />

          <p className="text-muted-foreground mt-4">
            <Link href="/docs/autenticacao" className="text-primary hover:underline">
              Ver documentação completa de autenticação →
            </Link>
          </p>
        </section>

        {/* Formato de respostas */}
        <section id="respostas" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Formato de respostas</h2>
          </div>

          <p className="text-muted-foreground mb-4">
            Todas as respostas seguem este formato padrão:
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2 text-green-400">✓ Sucesso (2xx)</h4>
              <CodeBlock
                language="json"
                code={`{
  "success": true,
  "data": {
    // Dados da resposta
  }
}`}
              />
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-red-400">✗ Erro (4xx/5xx)</h4>
              <CodeBlock
                language="json"
                code={`{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descrição do erro"
  }
}`}
              />
            </div>
          </div>
        </section>

        {/* Recursos */}
        <section id="recursos" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Code2 className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Recursos da API</h2>
          </div>

          <div className="grid gap-3">
            {resources.map((resource, index) => (
              <Link
                key={resource.name}
                href={resource.href}
                className="group relative flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all overflow-hidden"
              >
                <ShineBorder 
                  shineColor={["#8257e5", "#04d361"]} 
                  duration={12 + index * 2} 
                  borderWidth={1}
                />
                <div className="relative z-10">
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {resource.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {resource.description}
                  </p>
                </div>
                <span className="relative z-10 text-muted-foreground group-hover:text-primary transition-colors">
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <OnThisPage items={tocItems} />
    </div>
  );
}

