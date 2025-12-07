"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { Terminal, TypingAnimation, AnimatedSpan, CodeBlock } from "@/components/docs/terminal";
import { ApiPlayground } from "@/components/docs/api-playground";

const tocItems = [
  { id: "descricao", title: "Descrição", level: 2 },
  { id: "try-it", title: "Try it out", level: 2 },
  { id: "requisicao", title: "Requisição", level: 2 },
  { id: "body", title: "Corpo da Requisição", level: 2 },
  { id: "resposta", title: "Resposta", level: 2 },
];

export default function SetStatusDocsPage() {
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 px-8 py-10 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <span>API Reference</span>
          <span>/</span>
          <span>Profile</span>
          <span>/</span>
          <span>Status</span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-4xl font-bold tracking-tight">Alterar Recado</h1>
        </div>
        <p className="text-xl text-muted-foreground mb-8">
          Atualiza o texto de "Recado" (About/Status) do perfil do WhatsApp.
        </p>

        <section id="descricao" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Descrição</h2>
          <p className="text-muted-foreground">
            Este endpoint define a mensagem de status textual que aparece abaixo do nome no perfil do WhatsApp.
          </p>
        </section>

        <section id="try-it" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Try it out</h2>
          <ApiPlayground
            method="POST"
            endpoint="/api/profile/:instance/status"
            description="Define o recado do perfil"
            pathParams={[
              { name: "instance", type: "string", required: true, description: "Nome da instância" }
            ]}
            bodyParams={[
              { name: "status", type: "string", required: true, description: "Novo recado (ex: Ocupado)", default: "Disponível" }
            ]}
          />
        </section>

        <section id="requisicao" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Requisição</h2>
          <div className="p-4 rounded-lg bg-muted font-mono text-sm mb-4">
            POST /profile/:instance/status
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
                  <td className="px-4 py-3 font-mono">status</td>
                  <td className="px-4 py-3">string</td>
                  <td className="px-4 py-3 text-red-400">Sim</td>
                  <td className="px-4 py-3">Novo texto de recado</td>
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
    "status": "Disponível",
    "message": "Profile status updated successfully"
  }
}`}
          />
        </section>
      </div>
      <OnThisPage items={tocItems} />
    </div>
  );
}
