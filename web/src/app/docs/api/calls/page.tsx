"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { Terminal, TypingAnimation, AnimatedSpan, CodeBlock } from "@/components/docs/terminal";
import { Phone, PhoneOff } from "lucide-react";

const tocItems = [
  { id: "intro", title: "Introdução", level: 2 },
  { id: "endpoints", title: "Endpoints", level: 2 },
];

export default function CallsDocsPage() {
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 px-8 py-10 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <span>API Reference</span>
          <span>/</span>
          <span>Calls</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">Chamadas</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Gerencie chamadas de voz e vídeo recebidas.
        </p>

        <section id="intro" className="mb-12">
          <p className="text-lg text-muted-foreground mb-6">
            A API de Chamadas permite interagir com eventos de chamadas do WhatsApp. Atualmente, suporta a rejeição de chamadas recebidas.
          </p>
          <div className="p-4 border border-yellow-500/20 bg-yellow-500/10 rounded-lg text-sm text-yellow-200">
            <strong>Nota:</strong> O WhatsApp Web (e por extensão esta API via whatsmeow) não suporta *iniciar* chamadas de voz ou vídeo devido a limitações de criptografia (WebRTC/SRTP). Apenas rejeitar/ignorar chamadas recebidas é suportado.
          </div>
        </section>

        <section id="endpoints" className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Endpoints Disponíveis</h2>
          <div className="grid gap-4 md:grid-cols-1">
            <div className="p-6 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <PhoneOff className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Rejeitar Chamada</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Rejeita uma chamada de voz ou vídeo recebida.
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded">POST /call/:instance/reject</code>
            </div>
          </div>
        </section>
      </div>
      <OnThisPage items={tocItems} />
    </div>
  );
}
