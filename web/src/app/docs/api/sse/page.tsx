"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { Terminal, TypingAnimation, AnimatedSpan, CodeBlock } from "@/components/docs/terminal";
import { Radio, Users } from "lucide-react";

const tocItems = [
  { id: "intro", title: "Introdução", level: 2 },
  { id: "endpoints", title: "Endpoints", level: 2 },
  { id: "formato", title: "Formato dos Dados", level: 2 },
];

export default function SseDocsPage() {
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 px-8 py-10 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <span>API Reference</span>
          <span>/</span>
          <span>SSE</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">SSE (Server-Sent Events)</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Receba notificações em tempo real usando o protocolo padrão Server-Sent Events.
        </p>

        <section id="intro" className="mb-12">
          <p className="text-lg text-muted-foreground mb-6">
            O SSE é uma alternativa leve e nativa ao WebSocket para receber eventos do servidor. É suportado nativamente por todos os navegadores modernos e fácil de consumir em qualquer linguagem (`EventSource` no JS).
          </p>
        </section>

        <section id="endpoints" className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Endpoints Disponíveis</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-6 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Radio className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Stream de Instância</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Recebe eventos de uma instância específica.
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded">GET /sse/:instance</code>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Stream Global</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Recebe eventos de TODAS as instâncias (Requer API Key Global).
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded">GET /sse/</code>
            </div>
          </div>
        </section>

        <section id="formato" className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Formato dos Dados</h2>
          <p className="text-muted-foreground mb-4">
            Cada evento é enviado no formato padrão SSE:
          </p>
          <CodeBlock
            title="Formato SSE"
            language="text"
            code={`
event: message.upsert
data: {"instance_id":"...","type":"text","content":"Olá"}

event: connection.update
data: {"instance_id":"...","status":"connected"}
`}
          />
        </section>
      </div>
      <OnThisPage items={tocItems} />
    </div>
  );
}
