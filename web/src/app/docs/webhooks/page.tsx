"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { CodeBlock, ApiEndpoint } from "@/components/docs/terminal";
import { Webhook, Zap, Bell, AlertTriangle, Check } from "lucide-react";

const tocItems = [
  { id: "visao-geral", title: "Visão geral", level: 2 },
  { id: "configurar", title: "Configurar webhook", level: 2 },
  { id: "eventos", title: "Eventos disponíveis", level: 2 },
  { id: "payload", title: "Estrutura do payload", level: 2 },
  { id: "seguranca", title: "Segurança", level: 2 },
];

const events = [
  { name: "message.received", description: "Nova mensagem recebida" },
  { name: "message.sent", description: "Mensagem enviada com sucesso" },
  { name: "message.delivery", description: "Status de entrega atualizado" },
  { name: "message.read", description: "Mensagem foi lida" },
  { name: "connection.update", description: "Status da conexão alterado" },
  { name: "qrcode.update", description: "Novo QR Code gerado" },
  { name: "group.update", description: "Informações do grupo atualizadas" },
  { name: "group.participants", description: "Participantes adicionados/removidos" },
  { name: "presence.update", description: "Status de presença atualizado" },
];

export default function WebhooksPage() {
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 px-8 py-10 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <span>Introdução</span>
          <span className="text-muted-foreground">/</span>
          <span>Webhooks</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">Webhooks</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Receba notificações em tempo real sobre eventos do WhatsApp
        </p>

        {/* Visão Geral */}
        <section id="visao-geral" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Webhook className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Visão geral</h2>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>
              Webhooks permitem que sua aplicação receba notificações em tempo 
              real sobre eventos que acontecem no WhatsApp, como mensagens 
              recebidas, status de entrega e atualizações de conexão.
            </p>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Como funciona</h4>
                  <p className="text-sm">
                    Quando um evento ocorre, a TurboZap API envia uma requisição 
                    HTTP POST para a URL que você configurou, com todos os dados 
                    do evento no corpo da requisição.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Configurar */}
        <section id="configurar" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Configurar webhook</h2>
          </div>

          <p className="text-muted-foreground mb-6">
            Para configurar um webhook para sua instância:
          </p>

          <ApiEndpoint
            method="POST"
            path="/webhook/:instance/configure"
            title="Configurar webhook"
          />

          <CodeBlock
            title="Requisição"
            language="bash"
            className="mt-4 mb-4"
            code={`curl --request POST \\
  --url http://localhost:8080/webhook/minha-instancia/configure \\
  --header 'X-API-Key: sua-api-key' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "url": "https://seu-servidor.com/webhook",
    "events": ["message.received", "message.sent", "connection.update"],
    "enabled": true
  }'`}
          />

          <CodeBlock
            title="Resposta"
            language="json"
            code={`{
  "success": true,
  "data": {
    "webhook": {
      "id": "wh_123456",
      "url": "https://seu-servidor.com/webhook",
      "events": ["message.received", "message.sent", "connection.update"],
      "enabled": true,
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}`}
          />
        </section>

        {/* Eventos */}
        <section id="eventos" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Eventos disponíveis</h2>
          </div>

          <p className="text-muted-foreground mb-6">
            Você pode se inscrever nos seguintes eventos:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Evento</th>
                  <th className="text-left py-3 px-4 font-semibold">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.name} className="border-b border-border">
                    <td className="py-3 px-4">
                      <code className="px-2 py-1 bg-muted rounded text-sm text-primary">
                        {event.name}
                      </code>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {event.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Payload */}
        <section id="payload" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Webhook className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Estrutura do payload</h2>
          </div>

          <p className="text-muted-foreground mb-6">
            Cada webhook enviado segue esta estrutura:
          </p>

          <CodeBlock
            title="Exemplo: message.received"
            language="json"
            code={`{
  "event": "message.received",
  "instance": "minha-instancia",
  "timestamp": "2024-01-15T10:35:00.000Z",
  "data": {
    "message_id": "3EB0A1B2C3D4E5F6",
    "from": "5511999999999@s.whatsapp.net",
    "to": "5511888888888@s.whatsapp.net",
    "type": "text",
    "content": {
      "text": "Olá, tudo bem?"
    },
    "timestamp": "2024-01-15T10:35:00.000Z",
    "is_group": false,
    "push_name": "João Silva"
  }
}`}
            className="mb-6"
          />

          <CodeBlock
            title="Exemplo: connection.update"
            language="json"
            code={`{
  "event": "connection.update",
  "instance": "minha-instancia",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "status": "connected",
    "phone_number": "5511888888888",
    "profile_name": "Minha Empresa"
  }
}`}
          />
        </section>

        {/* Segurança */}
        <section id="seguranca" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">Segurança</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Use HTTPS</h4>
                  <p className="text-sm text-muted-foreground">
                    Sempre use URLs HTTPS para seus webhooks em produção.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Valide a origem</h4>
                  <p className="text-sm text-muted-foreground">
                    Verifique o IP de origem ou use um token secreto para validar 
                    que a requisição veio da TurboZap API.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Responda rápido</h4>
                  <p className="text-sm text-muted-foreground">
                    Retorne um status 200 rapidamente. Processe os dados de forma 
                    assíncrona se necessário.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-500 mb-1">Timeout</h4>
                  <p className="text-sm text-muted-foreground">
                    A TurboZap API aguarda no máximo 10 segundos por uma resposta. 
                    Se o timeout for atingido, a entrega é considerada falha e será 
                    tentada novamente.
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

