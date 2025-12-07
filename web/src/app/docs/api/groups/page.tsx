"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { CodeBlock } from "@/components/docs/terminal";
import { Users } from "lucide-react";
import Link from "next/link";

const tocItems = [
  { id: "visao-geral", title: "Visão geral", level: 2 },
  { id: "endpoints", title: "Endpoints", level: 2 },
];

const endpoints = [
  { method: "POST" as const, path: "/group/:instance/create", description: "Criar grupo", href: "/docs/api/groups/create" },
  { method: "GET" as const, path: "/group/:instance/list", description: "Listar grupos", href: "/docs/api/groups/list" },
  { method: "POST" as const, path: "/group/:instance/:jid/participants/add", description: "Adicionar participantes", href: "/docs/api/groups/add-participants" },
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
          Gerencie grupos do WhatsApp através da API
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
              A API de grupos permite gerenciar grupos do WhatsApp:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Criar grupos:</strong> Crie novos grupos com participantes</li>
              <li><strong>Listar grupos:</strong> Obtenha lista de todos os grupos</li>
              <li><strong>Gerenciar participantes:</strong> Adicione ou remova membros</li>
              <li><strong>Obter informações:</strong> Detalhes do grupo, participantes e configurações</li>
            </ul>
          </div>
        </section>

        {/* Endpoints */}
        <section id="endpoints" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
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
                  <span
                    className={`px-3 py-1.5 rounded-md text-xs font-bold border ${
                      endpoint.method === "GET"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    }`}
                  >
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
      </div>

      <OnThisPage items={tocItems} />
    </div>
  );
}
