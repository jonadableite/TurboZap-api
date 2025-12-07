"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { CodeBlock } from "@/components/docs/terminal";
import { Radio } from "lucide-react";
import Link from "next/link";

const tocItems = [
  { id: "visao-geral", title: "Visão geral", level: 2 },
  { id: "endpoints", title: "Endpoints", level: 2 },
];

const endpoints = [
  { method: "GET" as const, path: "/sse/:instance", description: "Stream SSE para uma instância", href: "/docs/api/sse/stream" },
  { method: "GET" as const, path: "/sse/", description: "Stream SSE global (todas as instâncias)", href: "/docs/api/sse/global" },
];

export default function SSEReferencePage() {
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 px-8 py-10 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <span>API</span>
          <span className="text-muted-foreground">/</span>
          <span>SSE (Eventos)</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">SSE (Server-Sent Events)</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Receba eventos em tempo real através de Server-Sent Events
        </p>

        {/* Visão Geral */}
        <section id="visao-geral" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Radio className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Visão geral</h2>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>
              Server-Sent Events (SSE) permite receber eventos do WhatsApp em tempo real sem precisar fazer polling.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Stream de instância:</strong> Receba eventos de uma instância específica</li>
              <li><strong>Stream global:</strong> Receba eventos de todas as instâncias</li>
              <li><strong>Tempo real:</strong> Eventos são enviados assim que ocorrem</li>
              <li><strong>Reconexão automática:</strong> A conexão é mantida e reconecta automaticamente</li>
            </ul>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                <strong>💡 Dica:</strong> SSE é ideal para aplicações que precisam de atualizações em tempo real,
                como dashboards ou aplicações de monitoramento.
              </p>
            </div>
          </div>
        </section>

        {/* Endpoints */}
        <section id="endpoints" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Radio className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Endpoints</h2>
          </div>

          <div className="space-y-3">
            {endpoints.map((endpoint) => (
              <Link
                key={endpoint.path}
                href={endpoint.href}
                className="block group"
              >
                <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-all">
                  <span className="px-3 py-1.5 rounded-md text-xs font-bold border bg-green-500/20 text-green-400 border-green-500/30">
                    {endpoint.method}
                  </span>
                  <code className="text-sm text-gray-300 font-mono flex-1">
                    {endpoint.path}
                  </code>
                  <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    {endpoint.description}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Exemplo de uso */}
        <section className="mb-16 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-6">Exemplo de uso</h2>
          <CodeBlock
            title="JavaScript"
            language="javascript"
            code={`// Conectar ao stream SSE
const eventSource = new EventSource('http://localhost:8080/sse/minha-instancia', {
  headers: {
    'X-API-Key': 'sua-api-key'
  }
});

// Escutar eventos
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Evento recebido:', data);
};

// Escutar eventos específicos
eventSource.addEventListener('message.received', (event) => {
  const message = JSON.parse(event.data);
  console.log('Nova mensagem:', message);
});

// Fechar conexão
eventSource.close();`}
          />
        </section>
      </div>

      <OnThisPage items={tocItems} />
    </div>
  );
}
