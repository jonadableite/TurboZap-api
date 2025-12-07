"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { Terminal, TypingAnimation, AnimatedSpan, CodeBlock } from "@/components/docs/terminal";

const tocItems = [
  { id: "descricao", title: "Descrição", level: 2 },
  { id: "requisicao", title: "Requisição", level: 2 },
  { id: "consumo", title: "Consumo com JavaScript", level: 2 },
  { id: "exemplos", title: "Exemplos CURL", level: 2 },
];

export default function SseStreamDocsPage() {
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 px-8 py-10 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <span>API Reference</span>
          <span>/</span>
          <span>SSE</span>
          <span>/</span>
          <span>Stream</span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-4xl font-bold tracking-tight">Stream de Instância</h1>
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-bold border border-green-500/50">
            GET
          </span>
        </div>
        <p className="text-xl text-muted-foreground mb-8">
          Abre uma conexão persistente para receber eventos de uma instância específica.
        </p>

        <section id="descricao" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Descrição</h2>
          <p className="text-muted-foreground">
            Este endpoint estabelece uma conexão Server-Sent Events (SSE). O cliente deve manter a conexão aberta para receber eventos em tempo real.
          </p>
        </section>

        <section id="requisicao" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Requisição</h2>
          <div className="p-4 rounded-lg bg-muted font-mono text-sm mb-4">
            GET /sse/:instance
          </div>

          <p className="text-sm text-yellow-500 bg-yellow-500/10 p-4 rounded mb-4">
            ⚠️ <strong>Importante:</strong> Para navegadores (EventSource), passar Headers de autenticação pode ser complicado. Recomendamos passar a API Key via Query Param se o cliente SSE não suportar Headers: <code>?apikey=SUA_KEY</code>
          </p>
        </section>

        <section id="consumo" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Consumo com JavaScript</h2>
          <CodeBlock
            title="Exemplo com EventSource (Nativo)"
            language="javascript"
            code={`
const instanceName = "minha-instancia";
const apiKey = "minha-api-key";

// Conectando ao SSE (usando query param para autenticação)
const evtSource = new EventSource(\`http://localhost:8080/sse/\${instanceName}?apikey=\${apiKey}\`);

evtSource.onopen = () => {
  console.log("Conectado ao SSE!");
};

evtSource.addEventListener("message.upsert", (event) => {
  const data = JSON.parse(event.data);
  console.log("Nova mensagem recebida:", data);
});

evtSource.addEventListener("connection.update", (event) => {
  const data = JSON.parse(event.data);
  console.log("Status da conexão:", data.status);
});

evtSource.onerror = (err) => {
  console.error("Erro na conexão SSE:", err);
};
`}
          />
        </section>

        <section id="exemplos" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Exemplos CURL</h2>
          <Terminal title="Conectar ao SSE">
            <TypingAnimation className="text-gray-400">
              {"$ curl -N \\"}
            </TypingAnimation>
            <AnimatedSpan className="text-blue-400 pl-4">
              {"--url http://localhost:8080/sse/minha-instancia \\"}
            </AnimatedSpan>
            <AnimatedSpan className="text-blue-400 pl-4">
              {"--header 'X-API-Key: sua-api-key'"}
            </AnimatedSpan>
          </Terminal>
          <p className="text-sm text-muted-foreground mt-4">
            Nota: A flag <code>-N</code> (buffer disabled) é necessária no curl para ver os eventos chegando em tempo real.
          </p>
        </section>
      </div>
      <OnThisPage items={tocItems} />
    </div>
  );
}
