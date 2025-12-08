"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { CodeBlock } from "@/components/docs/terminal";
import { ApiPlayground } from "@/components/docs/api-playground";

const tocItems = [
  { id: "descricao", title: "Descrição", level: 2 },
  { id: "try-it", title: "Try it out", level: 2 },
  { id: "requisicao", title: "Requisição", level: 2 },
  { id: "body", title: "Corpo da Requisição", level: 2 },
  { id: "resposta", title: "Resposta", level: 2 },
];

export default function RejectCallDocsPage() {
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 px-8 py-10 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <span>API Reference</span>
          <span>/</span>
          <span>Calls</span>
          <span>/</span>
          <span>Reject</span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-4xl font-bold tracking-tight">Rejeitar Chamada</h1>
        </div>
        <p className="text-xl text-muted-foreground mb-8">
          Rejeita uma chamada recebida.
        </p>

        <section id="descricao" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Descrição</h2>
          <p className="text-muted-foreground">
            Envia um sinal de rejeição para uma chamada de voz ou vídeo recebida.
          </p>
        </section>

        <section id="try-it" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Try it out</h2>
          <ApiPlayground
            method="POST"
            endpoint="/api/call/:instance/reject"
            description="Rejeita uma chamada recebida"
            pathParams={[
              { name: "instance", type: "string", required: true, description: "Nome da instância" }
            ]}
            bodyParams={[
              { name: "call_from", type: "string", required: true, description: "JID de quem está ligando", default: "5511999999999@s.whatsapp.net" },
              { name: "call_id", type: "string", required: true, description: "ID único da chamada", default: "ABC123XYZ" }
            ]}
          />
        </section>

        <section id="requisicao" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Requisição</h2>
          <div className="p-4 rounded-lg bg-muted font-mono text-sm mb-4">
            POST /call/:instance/reject
          </div>
        </section>

        <section id="body" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Corpo da Requisição (JSON)</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Campo</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Obrigatório</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="bg-card">
                  <td className="px-4 py-3 font-mono">call_from</td>
                  <td className="px-4 py-3">string</td>
                  <td className="px-4 py-3 text-red-400">Sim</td>
                  <td className="px-4 py-3">JID de quem está ligando (ex: 5511999999999@s.whatsapp.net)</td>
                </tr>
                <tr className="bg-card/50">
                  <td className="px-4 py-3 font-mono">call_id</td>
                  <td className="px-4 py-3">string</td>
                  <td className="px-4 py-3 text-red-400">Sim</td>
                  <td className="px-4 py-3">ID único da chamada (recebido no webhook)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="resposta" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Resposta</h2>
          <CodeBlock
            title="Exemplo de Resposta (200 OK)"
            language="json"
            code={`{
  "success": true,
  "data": {
    "call_from": "5511999999999@s.whatsapp.net",
    "call_id": "ABC123XYZ",
    "message": "Call rejected successfully"
  }
}`}
          />
        </section>
      </div>
      <OnThisPage items={tocItems} />
    </div>
  );
}
