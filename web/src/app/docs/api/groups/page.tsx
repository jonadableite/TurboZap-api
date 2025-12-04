"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { CodeBlock, ApiEndpoint } from "@/components/docs/terminal";
import { Users, Plus, List, UserPlus, UserMinus, Settings } from "lucide-react";

const tocItems = [
  { id: "visao-geral", title: "Visão geral", level: 2 },
  { id: "endpoints", title: "Endpoints", level: 2 },
  { id: "criar-grupo", title: "Criar grupo", level: 2 },
  { id: "participantes", title: "Gerenciar participantes", level: 2 },
];

export default function GroupsReferencePage() {
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 px-8 py-10 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <span>API</span>
          <span className="text-muted-foreground">/</span>
          <span>Grupos</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">Grupos</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Crie e gerencie grupos do WhatsApp via API
        </p>

        {/* Visão Geral */}
        <section id="visao-geral" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Visão geral</h2>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>
              A API de grupos permite criar, gerenciar e interagir com grupos 
              do WhatsApp. Você pode:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Criar novos grupos</li>
              <li>Listar grupos que a instância participa</li>
              <li>Obter informações detalhadas de um grupo</li>
              <li>Adicionar e remover participantes</li>
              <li>Promover e rebaixar administradores</li>
              <li>Atualizar configurações do grupo</li>
            </ul>
          </div>
        </section>

        {/* Endpoints */}
        <section id="endpoints" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <List className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Endpoints</h2>
          </div>

          <div className="space-y-3">
            <ApiEndpoint method="POST" path="/group/:instance/create" title="Criar grupo" />
            <ApiEndpoint method="GET" path="/group/:instance/list" title="Listar grupos" />
            <ApiEndpoint method="GET" path="/group/:instance/:groupId/info" title="Info do grupo" />
            <ApiEndpoint method="POST" path="/group/:instance/:groupId/add" title="Adicionar participantes" />
            <ApiEndpoint method="POST" path="/group/:instance/:groupId/remove" title="Remover participantes" />
            <ApiEndpoint method="POST" path="/group/:instance/:groupId/promote" title="Promover a admin" />
            <ApiEndpoint method="POST" path="/group/:instance/:groupId/demote" title="Rebaixar admin" />
            <ApiEndpoint method="PUT" path="/group/:instance/:groupId/name" title="Alterar nome" />
            <ApiEndpoint method="PUT" path="/group/:instance/:groupId/description" title="Alterar descrição" />
            <ApiEndpoint method="POST" path="/group/:instance/:groupId/leave" title="Sair do grupo" />
          </div>
        </section>

        {/* Criar grupo */}
        <section id="criar-grupo" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Criar grupo</h2>
          </div>

          <ApiEndpoint method="POST" path="/group/:instance/create" />

          <CodeBlock
            title="Requisição"
            language="json"
            className="mt-4 mb-4"
            code={`{
  "name": "Meu Grupo",
  "participants": [
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
    "group": {
      "jid": "120363123456789012@g.us",
      "name": "Meu Grupo",
      "owner": "5511999999999@s.whatsapp.net",
      "created_at": "2024-01-15T10:30:00.000Z",
      "participants": [
        {
          "jid": "5511999999999@s.whatsapp.net",
          "is_admin": true,
          "is_super_admin": true
        },
        {
          "jid": "5511888888888@s.whatsapp.net",
          "is_admin": false,
          "is_super_admin": false
        }
      ]
    }
  }
}`}
          />
        </section>

        {/* Participantes */}
        <section id="participantes" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Gerenciar participantes</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Adicionar participantes</h3>
              <ApiEndpoint method="POST" path="/group/:instance/:groupId/add" />
              <CodeBlock
                language="json"
                className="mt-3"
                code={`{
  "participants": [
    "5511999999999",
    "5511888888888"
  ]
}`}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Remover participantes</h3>
              <ApiEndpoint method="POST" path="/group/:instance/:groupId/remove" />
              <CodeBlock
                language="json"
                className="mt-3"
                code={`{
  "participants": [
    "5511999999999"
  ]
}`}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Promover a administrador</h3>
              <ApiEndpoint method="POST" path="/group/:instance/:groupId/promote" />
              <CodeBlock
                language="json"
                className="mt-3"
                code={`{
  "participants": [
    "5511999999999"
  ]
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

