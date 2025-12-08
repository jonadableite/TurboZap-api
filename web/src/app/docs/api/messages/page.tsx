"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { CodeBlock } from "@/components/docs/terminal";
import { MessageCircle, Send } from "lucide-react";
import Link from "next/link";

const tocItems = [
  { id: "visao-geral", title: "Visão geral", level: 2 },
  { id: "endpoints", title: "Endpoints", level: 2 },
  { id: "modelo", title: "Modelo de dados", level: 2 },
];

const endpoints = [
  { method: "POST" as const, path: "/message/:instance/text", description: "Enviar mensagem de texto", href: "/docs/api/messages/text" },
  { method: "POST" as const, path: "/message/:instance/media", description: "Enviar mídia (imagem/vídeo/documento)", href: "/docs/api/messages/image" },
  { method: "POST" as const, path: "/message/:instance/audio", description: "Enviar áudio/voz", href: "/docs/api/messages/audio" },
  { method: "POST" as const, path: "/message/:instance/document", description: "Enviar documento", href: "/docs/api/messages/document" },
  { method: "POST" as const, path: "/message/:instance/location", description: "Enviar localização", href: "/docs/api/messages/location" },
  { method: "POST" as const, path: "/message/:instance/contact", description: "Enviar cartão de contato", href: "/docs/api/messages/contact" },
  { method: "POST" as const, path: "/message/:instance/reaction", description: "Enviar reação", href: "/docs/api/messages/reaction" },
  { method: "POST" as const, path: "/message/:instance/button", description: "Enviar mensagem com botões", href: "/docs/api/messages/buttons" },
  { method: "POST" as const, path: "/message/:instance/list", description: "Enviar mensagem de lista", href: "/docs/api/messages/list" },
];

export default function MessagesReferencePage() {
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 px-8 py-10 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <span>API</span>
          <span className="text-muted-foreground">/</span>
          <span>Mensagens</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">Mensagens</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Envie diferentes tipos de mensagens através da API de mensagens
        </p>

        {/* Visão Geral */}
        <section id="visao-geral" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Visão geral</h2>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>
              A API de mensagens permite enviar diversos tipos de conteúdo através do WhatsApp:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Texto:</strong> Mensagens de texto simples</li>
              <li><strong>Mídia:</strong> Imagens, vídeos e documentos</li>
              <li><strong>Áudio:</strong> Mensagens de voz e áudio</li>
              <li><strong>Localização:</strong> Coordenadas geográficas</li>
              <li><strong>Contato:</strong> Cartões de contato (vCard)</li>
              <li><strong>Reações:</strong> Emojis de reação em mensagens</li>
              <li><strong>Botões:</strong> Mensagens interativas com até 3 botões</li>
              <li><strong>Listas:</strong> Mensagens com listas selecionáveis</li>
            </ul>
            <p>
              Todos os endpoints de mensagens requerem o parâmetro <code className="px-1.5 py-0.5 rounded bg-muted text-xs">:instance</code> no path,
              que identifica qual instância do WhatsApp deve enviar a mensagem.
            </p>
          </div>
        </section>

        {/* Endpoints */}
        <section id="endpoints" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Send className="h-5 w-5 text-primary" />
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
                  <span className="px-3 py-1.5 rounded-md text-xs font-bold border bg-blue-500/20 text-blue-400 border-blue-500/30">
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

        {/* Modelo */}
        <section id="modelo" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Resposta padrão</h2>
          </div>

          <CodeBlock
            title="Message Response"
            language="json"
            code={`{
  "success": true,
  "data": {
    "message_id": "3EB0A1B2C3D4E5F6",
    "status": "sent",
    "timestamp": "2024-01-15T10:35:00.000Z"
  }
}`}
          />

          <div className="mt-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Campo</th>
                  <th className="text-left py-3 px-4 font-semibold">Tipo</th>
                  <th className="text-left py-3 px-4 font-semibold">Descrição</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code>success</code></td>
                  <td className="py-3 px-4 text-muted-foreground">boolean</td>
                  <td className="py-3 px-4 text-muted-foreground">Indica se a operação foi bem-sucedida</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code>data.message_id</code></td>
                  <td className="py-3 px-4 text-muted-foreground">string</td>
                  <td className="py-3 px-4 text-muted-foreground">ID único da mensagem enviada</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code>data.status</code></td>
                  <td className="py-3 px-4 text-muted-foreground">string</td>
                  <td className="py-3 px-4 text-muted-foreground">Status da mensagem (sent, delivered, read, error)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4"><code>data.timestamp</code></td>
                  <td className="py-3 px-4 text-muted-foreground">ISO8601</td>
                  <td className="py-3 px-4 text-muted-foreground">Data e hora do envio</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <OnThisPage items={tocItems} />
    </div>
  );
}
