"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { CodeBlock, ApiEndpoint } from "@/components/docs/terminal";
import { Zap, Eye, EyeOff, PenLine } from "lucide-react";

const tocItems = [
  { id: "visao-geral", title: "Visão geral", level: 2 },
  { id: "tipos", title: "Tipos de presença", level: 2 },
  { id: "definir", title: "Definir presença", level: 2 },
];

const presenceTypes = [
  { type: "available", description: "Online - mostra que você está disponível", color: "green" },
  { type: "unavailable", description: "Offline - esconde o status online", color: "gray" },
  { type: "composing", description: "Digitando... - mostra animação de digitação", color: "blue" },
  { type: "recording", description: "Gravando áudio... - mostra indicador de gravação", color: "red" },
  { type: "paused", description: "Parou de digitar - remove o indicador", color: "yellow" },
];

export default function PresenceReferencePage() {
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 px-8 py-10 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <span>API</span>
          <span className="text-muted-foreground">/</span>
          <span>Presença</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">Presença</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Controle o status de presença da sua instância
        </p>

        {/* Visão Geral */}
        <section id="visao-geral" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Visão geral</h2>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>
              A API de presença permite controlar como sua instância aparece 
              para outros usuários. Você pode:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Mostrar que está online ou offline</li>
              <li>Simular digitação ("está escrevendo...")</li>
              <li>Simular gravação de áudio</li>
              <li>Inscrever-se para receber atualizações de presença de contatos</li>
            </ul>
          </div>
        </section>

        {/* Tipos de presença */}
        <section id="tipos" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Tipos de presença</h2>
          </div>

          <div className="space-y-3">
            {presenceTypes.map((presence) => (
              <div
                key={presence.type}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
              >
                <code className={`px-3 py-1 rounded text-sm font-bold bg-${presence.color}-500/20 text-${presence.color}-400`}>
                  {presence.type}
                </code>
                <span className="text-muted-foreground">{presence.description}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Definir presença */}
        <section id="definir" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <PenLine className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Definir presença</h2>
          </div>

          <ApiEndpoint method="POST" path="/presence/:instance/set" />

          <div className="space-y-6 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Mostrar "digitando..."</h3>
              <CodeBlock
                language="json"
                code={`{
  "to": "5511999999999",
  "type": "composing"
}`}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Mostrar "gravando áudio..."</h3>
              <CodeBlock
                language="json"
                code={`{
  "to": "5511999999999",
  "type": "recording"
}`}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Parar indicador</h3>
              <CodeBlock
                language="json"
                code={`{
  "to": "5511999999999",
  "type": "paused"
}`}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Ficar online/offline</h3>
              <CodeBlock
                language="json"
                code={`{
  "type": "available"  // ou "unavailable"
}`}
              />
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl border border-primary/30 bg-primary/10">
            <p className="text-sm text-muted-foreground">
              <strong className="text-primary">Dica de UX:</strong> Simule digitação 
              por 1-3 segundos antes de enviar uma mensagem para parecer mais 
              natural e humano.
            </p>
          </div>
        </section>
      </div>

      <OnThisPage items={tocItems} />
    </div>
  );
}

