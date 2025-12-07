"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { Terminal, TypingAnimation, AnimatedSpan, CodeBlock } from "@/components/docs/terminal";
import { ApiPlayground } from "@/components/docs/api-playground";

const tocItems = [
  { id: "descricao", title: "Descrição", level: 2 },
  { id: "try-it", title: "Try it out", level: 2 },
  { id: "requisicao", title: "Requisição", level: 2 },
  { id: "resposta", title: "Resposta", level: 2 },
];

export default function GetPrivacyDocsPage() {
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 px-8 py-10 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <span>API Reference</span>
          <span>/</span>
          <span>Profile</span>
          <span>/</span>
          <span>Privacy</span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-4xl font-bold tracking-tight">Obter Privacidade</h1>
        </div>
        <p className="text-xl text-muted-foreground mb-8">
          Recupera as configurações atuais de privacidade da instância.
        </p>

        <section id="descricao" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Descrição</h2>
          <p className="text-muted-foreground">
            Este endpoint retorna todas as configurações de privacidade atuais da conta do WhatsApp conectada à instância, incluindo configurações de visto por último, foto de perfil, status e confirmação de leitura.
          </p>
        </section>

        <section id="try-it" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Try it out</h2>
          <p className="text-muted-foreground mb-4">
            Teste o endpoint diretamente aqui no navegador. Insira o nome da sua instância conectada e sua API Key.
          </p>

          <ApiPlayground
            method="GET"
            endpoint="/api/profile/:instance/privacy"
            description="Recupera configurações de privacidade"
            pathParams={[
              { name: "instance", type: "string", required: true, description: "Nome da instância (ex: minha-instancia)" }
            ]}
          />
        </section>

        <section id="requisicao" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Requisição Detalhada</h2>

          <h3 className="text-lg font-semibold mb-2">Parâmetros de URL</h3>
          <div className="overflow-x-auto rounded-lg border border-border mb-6">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Parâmetro</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Obrigatório</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="bg-card">
                  <td className="px-4 py-3 font-mono">instance</td>
                  <td className="px-4 py-3">string</td>
                  <td className="px-4 py-3 text-red-400">Sim</td>
                  <td className="px-4 py-3">Nome da instância conectada</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold mb-2">Headers</h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Header</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Obrigatório</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="bg-card">
                  <td className="px-4 py-3 font-mono">X-API-Key</td>
                  <td className="px-4 py-3">Sua API Key</td>
                  <td className="px-4 py-3 text-red-400">Sim</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="resposta" className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Exemplo de Resposta</h2>
          <CodeBlock
            title="JSON Response"
            language="json"
            code={`{
  "success": true,
  "data": {
    "group_add": "all",
    "last_seen": "contacts",
    "status": "contacts",
    "profile": "all",
    "read_receipts": "all",
    "online": "all",
    "call_add": "all"
  }
}`}
          />
        </section>
      </div>
      <OnThisPage items={tocItems} />
    </div>
  );
}
