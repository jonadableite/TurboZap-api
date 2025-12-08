"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { CodeBlock, ApiEndpoint } from "@/components/docs/terminal";
import { Contact, Search, Image as ImageIcon, UserCheck } from "lucide-react";

const tocItems = [
  { id: "visao-geral", title: "Visão geral", level: 2 },
  { id: "endpoints", title: "Endpoints", level: 2 },
  { id: "verificar-numero", title: "Verificar número", level: 2 },
  { id: "foto-perfil", title: "Foto de perfil", level: 2 },
];

export default function ContactsReferencePage() {
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 px-8 py-10 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <span>API</span>
          <span className="text-muted-foreground">/</span>
          <span>Contatos</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">Contatos</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Verifique números e obtenha informações de contatos
        </p>

        {/* Visão Geral */}
        <section id="visao-geral" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Contact className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Visão geral</h2>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>
              A API de contatos permite verificar se um número possui WhatsApp, 
              obter fotos de perfil e gerenciar a lista de contatos.
            </p>
          </div>
        </section>

        {/* Endpoints */}
        <section id="endpoints" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Endpoints</h2>
          </div>

          <div className="space-y-3">
            <ApiEndpoint method="POST" path="/contact/:instance/check" title="Verificar números" />
            <ApiEndpoint method="GET" path="/contact/:instance/:phone/profile-pic" title="Foto de perfil" />
            <ApiEndpoint method="GET" path="/contact/:instance/:phone/info" title="Info do contato" />
            <ApiEndpoint method="POST" path="/contact/:instance/block" title="Bloquear contato" />
            <ApiEndpoint method="POST" path="/contact/:instance/unblock" title="Desbloquear contato" />
            <ApiEndpoint method="GET" path="/contact/:instance/list" title="Listar contatos" />
          </div>
        </section>

        {/* Verificar número */}
        <section id="verificar-numero" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Verificar número</h2>
          </div>

          <p className="text-muted-foreground mb-4">
            Verifique se um ou mais números possuem WhatsApp antes de enviar mensagens:
          </p>

          <ApiEndpoint method="POST" path="/contact/:instance/check" />

          <CodeBlock
            title="Requisição"
            language="json"
            className="mt-4 mb-4"
            code={`{
  "phones": [
    "5511999999999",
    "5511888888888",
    "5511777777777"
  ]
}`}
          />

          <CodeBlock
            title="Resposta"
            language="json"
            code={`{
  "success": true,
  "data": {
    "results": [
      {
        "phone": "5511999999999",
        "exists": true,
        "jid": "5511999999999@s.whatsapp.net"
      },
      {
        "phone": "5511888888888",
        "exists": true,
        "jid": "5511888888888@s.whatsapp.net"
      },
      {
        "phone": "5511777777777",
        "exists": false,
        "jid": null
      }
    ]
  }
}`}
          />

          <div className="mt-4 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
            <p className="text-sm text-muted-foreground">
              <strong className="text-yellow-500">Dica:</strong> Sempre verifique 
              os números antes de enviar mensagens em massa para evitar erros e 
              melhorar a taxa de entrega.
            </p>
          </div>
        </section>

        {/* Foto de perfil */}
        <section id="foto-perfil" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <ImageIcon className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Foto de perfil</h2>
          </div>

          <p className="text-muted-foreground mb-4">
            Obtenha a URL da foto de perfil de um contato:
          </p>

          <ApiEndpoint method="GET" path="/contact/:instance/:phone/profile-pic" />

          <CodeBlock
            title="Resposta"
            language="json"
            className="mt-4"
            code={`{
  "success": true,
  "data": {
    "phone": "5511999999999",
    "profile_pic_url": "https://pps.whatsapp.net/v/t61.24694-24/...",
    "has_profile_pic": true
  }
}`}
          />

          <div className="mt-4 p-4 rounded-xl border border-border bg-card">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> A URL da foto de perfil é temporária e pode 
              expirar. Faça cache local da imagem se necessário.
            </p>
          </div>
        </section>
      </div>

      <OnThisPage items={tocItems} />
    </div>
  );
}

