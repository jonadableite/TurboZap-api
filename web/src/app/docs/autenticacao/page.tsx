"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { CodeBlock } from "@/components/docs/terminal";
import { Key, Shield, AlertTriangle, Check } from "lucide-react";

const tocItems = [
  { id: "visao-geral", title: "Visão geral", level: 2 },
  { id: "api-key", title: "Usando a API Key", level: 2 },
  { id: "headers", title: "Headers de autenticação", level: 2 },
  { id: "erros", title: "Erros de autenticação", level: 2 },
  { id: "boas-praticas", title: "Boas práticas", level: 2 },
];

export default function AuthPage() {
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 px-8 py-10 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <span>Introdução</span>
          <span className="text-muted-foreground">/</span>
          <span>Autenticação</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">Autenticação</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Como autenticar suas requisições na TurboZap API
        </p>

        {/* Visão Geral */}
        <section id="visao-geral" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Visão geral</h2>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>
              A TurboZap API utiliza <strong>API Keys</strong> para autenticação. 
              Cada instância criada recebe uma API Key única que deve ser enviada 
              em todas as requisições relacionadas àquela instância.
            </p>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-start gap-3">
                <Key className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">API Key por Instância</h4>
                  <p className="text-sm">
                    Quando você cria uma instância, a API retorna uma API Key única. 
                    Use essa chave para todas as operações naquela instância (mensagens, grupos, etc).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* API Key */}
        <section id="api-key" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Usando a API Key</h2>
          </div>

          <p className="text-muted-foreground mb-6">
            Ao criar uma instância, você receberá uma resposta como esta:
          </p>

          <CodeBlock
            title="Resposta da criação de instância"
            language="json"
            code={`{
  "success": true,
  "data": {
    "instance": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "minha-instancia",
      "api_key": "550e8400-e29b-41d4-a716-446655440000-a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "status": "disconnected",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}`}
            className="mb-6"
          />

          <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-500 mb-1">Importante</h4>
                <p className="text-sm text-muted-foreground">
                  Guarde sua API Key em um local seguro! Ela é mostrada apenas 
                  uma vez durante a criação da instância. Se você perder, 
                  precisará criar uma nova instância.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Headers */}
        <section id="headers" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Headers de autenticação</h2>
          </div>

          <p className="text-muted-foreground mb-6">
            Existem duas formas de enviar sua API Key:
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Opção 1: Header X-API-Key (Recomendado)</h3>
              <CodeBlock
                title="Usando X-API-Key"
                language="bash"
                code={`curl --request POST \\
  --url http://localhost:8080/message/minha-instancia/text \\
  --header 'X-API-Key: sua-api-key-aqui' \\
  --header 'Content-Type: application/json' \\
  --data '{"to": "5511999999999", "text": "Olá!"}'`}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Opção 2: Header Authorization Bearer</h3>
              <CodeBlock
                title="Usando Authorization Bearer"
                language="bash"
                code={`curl --request POST \\
  --url http://localhost:8080/message/minha-instancia/text \\
  --header 'Authorization: Bearer sua-api-key-aqui' \\
  --header 'Content-Type: application/json' \\
  --data '{"to": "5511999999999", "text": "Olá!"}'`}
              />
            </div>
          </div>
        </section>

        {/* Erros */}
        <section id="erros" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold">Erros de autenticação</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <h4 className="font-semibold text-foreground mb-2">401 Unauthorized</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Retornado quando a API Key não é fornecida ou é inválida.
              </p>
              <CodeBlock
                language="json"
                code={`{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "API key is required"
  }
}`}
              />
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <h4 className="font-semibold text-foreground mb-2">403 Forbidden</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Retornado quando a API Key não tem permissão para acessar o recurso.
              </p>
              <CodeBlock
                language="json"
                code={`{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Invalid API key for this instance"
  }
}`}
              />
            </div>
          </div>
        </section>

        {/* Boas práticas */}
        <section id="boas-praticas" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">Boas práticas</h2>
          </div>

          <div className="grid gap-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Use variáveis de ambiente</h4>
                  <p className="text-sm text-muted-foreground">
                    Nunca deixe sua API Key hardcoded no código. Use variáveis de 
                    ambiente como <code className="px-1 py-0.5 bg-muted rounded text-xs">TURBOZAP_API_KEY</code>.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Não exponha no frontend</h4>
                  <p className="text-sm text-muted-foreground">
                    A API Key deve ser usada apenas no backend. Nunca exponha ela 
                    em código JavaScript que roda no navegador.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Rotacione periodicamente</h4>
                  <p className="text-sm text-muted-foreground">
                    Se suspeitar que sua API Key foi comprometida, delete a 
                    instância e crie uma nova imediatamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <OnThisPage items={tocItems} />
    </div>
  );
}

