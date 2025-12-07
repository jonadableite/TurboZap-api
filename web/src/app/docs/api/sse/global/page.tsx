"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { Terminal, TypingAnimation, AnimatedSpan, CodeBlock } from "@/components/docs/terminal";

const tocItems = [
  { id: "descricao", title: "Descrição", level: 2 },
  { id: "requisicao", title: "Requisição", level: 2 },
  { id: "exemplos", title: "Exemplos", level: 2 },
];

export default function SseGlobalDocsPage() {
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 px-8 py-10 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <span>API Reference</span>
          <span>/</span>
          <span>SSE</span>
          <span>/</span>
          <span>Global Stream</span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-4xl font-bold tracking-tight">Stream Global</h1>
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-bold border border-green-500/50">
            GET
          </span>
        </div>
        <p className="text-xl text-muted-foreground mb-8">
          Recebe eventos de TODAS as instâncias do servidor em uma única conexão.
        </p>

        <section id="descricao" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Descrição</h2>
          <p className="text-muted-foreground">
            Este endpoint é útil para painéis administrativos que precisam monitorar múltiplas instâncias simultaneamente sem abrir múltiplas conexões.
          </p>
          <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-lg text-sm text-red-200 mt-4">
            ⚠️ <strong>Atenção:</strong> Este endpoint requer autenticação com a <strong>API Key Global</strong> (definida no `.env`). Keys de instância não funcionarão.
          </div>
        </section>

        <section id="requisicao" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Requisição</h2>
          <div className="p-4 rounded-lg bg-muted font-mono text-sm mb-4">
            GET /sse/
          </div>
        </section>

        <section id="exemplos" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Exemplos</h2>
          <Terminal title="Conectar ao SSE Global">
            <TypingAnimation className="text-gray-400">
              {"$ curl -N \\"}
            </TypingAnimation>
            <AnimatedSpan className="text-blue-400 pl-4">
              {"--url http://localhost:8080/sse/ \\"}
            </AnimatedSpan>
            <AnimatedSpan className="text-blue-400 pl-4">
              {"--header 'X-API-Key: SUA_API_KEY_GLOBAL'"}
            </AnimatedSpan>
          </Terminal>
        </section>
      </div>
      <OnThisPage items={tocItems} />
    </div>
  );
}
