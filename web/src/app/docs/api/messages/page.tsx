"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { CodeBlock, ApiEndpoint } from "@/components/docs/terminal";
import { MessageSquare, Send, Image, FileAudio, File, MapPin, Contact, Smile, List, LayoutGrid } from "lucide-react";
import Link from "next/link";

const tocItems = [
  { id: "visao-geral", title: "Visão geral", level: 2 },
  { id: "endpoints", title: "Endpoints", level: 2 },
  { id: "formato-numero", title: "Formato do número", level: 2 },
  { id: "tipos-mensagem", title: "Tipos de mensagem", level: 2 },
];

const endpoints = [
  { method: "POST" as const, path: "/message/:instance/text", description: "Enviar texto", icon: <MessageSquare className="h-4 w-4" /> },
  { method: "POST" as const, path: "/message/:instance/image", description: "Enviar imagem", icon: <Image className="h-4 w-4" /> },
  { method: "POST" as const, path: "/message/:instance/audio", description: "Enviar áudio/PTT", icon: <FileAudio className="h-4 w-4" /> },
  { method: "POST" as const, path: "/message/:instance/document", description: "Enviar documento", icon: <File className="h-4 w-4" /> },
  { method: "POST" as const, path: "/message/:instance/video", description: "Enviar vídeo", icon: <File className="h-4 w-4" /> },
  { method: "POST" as const, path: "/message/:instance/sticker", description: "Enviar sticker", icon: <Smile className="h-4 w-4" /> },
  { method: "POST" as const, path: "/message/:instance/location", description: "Enviar localização", icon: <MapPin className="h-4 w-4" /> },
  { method: "POST" as const, path: "/message/:instance/contact", description: "Enviar contato", icon: <Contact className="h-4 w-4" /> },
  { method: "POST" as const, path: "/message/:instance/reaction", description: "Enviar reação", icon: <Smile className="h-4 w-4" /> },
  { method: "POST" as const, path: "/message/:instance/poll", description: "Enviar enquete", icon: <List className="h-4 w-4" /> },
  { method: "POST" as const, path: "/message/:instance/buttons", description: "Enviar botões", icon: <LayoutGrid className="h-4 w-4" /> },
  { method: "POST" as const, path: "/message/:instance/list", description: "Enviar lista", icon: <List className="h-4 w-4" /> },
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
          Envie todos os tipos de mensagem suportados pelo WhatsApp
        </p>

        {/* Visão Geral */}
        <section id="visao-geral" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Visão geral</h2>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>
              A API de mensagens permite enviar diversos tipos de conteúdo para 
              contatos e grupos do WhatsApp. Todos os endpoints seguem o padrão:
            </p>
            
            <div className="p-4 rounded-xl border border-border bg-card">
              <code className="text-primary">
                POST /message/:instance/:type
              </code>
            </div>

            <p>
              Onde <code className="px-1 py-0.5 bg-muted rounded text-sm">:instance</code> é 
              o nome da sua instância e <code className="px-1 py-0.5 bg-muted rounded text-sm">:type</code> é 
              o tipo de mensagem.
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

          <div className="grid gap-3 md:grid-cols-2">
            {endpoints.map((endpoint) => (
              <div
                key={endpoint.path}
                className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-all"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  {endpoint.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <code className="text-xs text-gray-400 font-mono block truncate">
                    {endpoint.path}
                  </code>
                  <span className="text-sm text-muted-foreground">
                    {endpoint.description}
                  </span>
                </div>
                <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-bold">
                  POST
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Formato do número */}
        <section id="formato-numero" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Contact className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Formato do número</h2>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>
              O campo <code className="px-1 py-0.5 bg-muted rounded text-sm">to</code> deve 
              conter o número do destinatário no formato internacional, apenas números:
            </p>

            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/30 bg-green-500/10">
                <span className="text-green-500">✓</span>
                <code className="text-sm">5511999999999</code>
                <span className="text-sm text-muted-foreground">(Brasil, DDD 11)</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/30 bg-green-500/10">
                <span className="text-green-500">✓</span>
                <code className="text-sm">14155551234</code>
                <span className="text-sm text-muted-foreground">(USA)</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
                <span className="text-red-500">✗</span>
                <code className="text-sm">+55 11 99999-9999</code>
                <span className="text-sm text-muted-foreground">(com formatação)</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
                <span className="text-red-500">✗</span>
                <code className="text-sm">011999999999</code>
                <span className="text-sm text-muted-foreground">(sem código do país)</span>
              </div>
            </div>

            <p className="mt-4">
              Para <strong>grupos</strong>, use o JID do grupo:
            </p>

            <div className="p-4 rounded-xl border border-border bg-card">
              <code className="text-sm text-primary">
                120363123456789012@g.us
              </code>
            </div>
          </div>
        </section>

        {/* Tipos de mensagem */}
        <section id="tipos-mensagem" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Tipos de mensagem</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Texto simples</h3>
              <CodeBlock
                language="json"
                code={`{
  "to": "5511999999999",
  "text": "Olá! Como posso ajudar?"
}`}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Imagem com legenda</h3>
              <CodeBlock
                language="json"
                code={`{
  "to": "5511999999999",
  "url": "https://exemplo.com/imagem.jpg",
  "caption": "Confira nossa promoção!"
}`}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Áudio (PTT)</h3>
              <CodeBlock
                language="json"
                code={`{
  "to": "5511999999999",
  "url": "https://exemplo.com/audio.mp3",
  "ptt": true
}`}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Localização</h3>
              <CodeBlock
                language="json"
                code={`{
  "to": "5511999999999",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "name": "São Paulo",
  "address": "Av. Paulista, 1000"
}`}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Reação</h3>
              <CodeBlock
                language="json"
                code={`{
  "to": "5511999999999",
  "message_id": "3EB0A1B2C3D4E5F6",
  "emoji": "👍"
}`}
              />
            </div>
          </div>
        </section>
      </div>

      <OnThisPage items={tocItems} />
    </div>
  );
}

