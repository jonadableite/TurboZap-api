"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { Shield } from "lucide-react";
import Link from "next/link";

const tocItems = [
  { id: "visao-geral", title: "Visão geral", level: 2 },
  { id: "endpoints", title: "Endpoints", level: 2 },
];

const endpoints = [
  { method: "GET" as const, path: "/profile/:instance/privacy", description: "Obter configurações de privacidade", href: "/docs/api/profile/privacy" },
  { method: "POST" as const, path: "/profile/:instance/privacy", description: "Alterar configuração de privacidade", href: "/docs/api/profile/privacy-set" },
  { method: "POST" as const, path: "/profile/:instance/status", description: "Alterar recado/about", href: "/docs/api/profile/status" },
];

export default function ProfileReferencePage() {
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 px-8 py-10 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <span>API</span>
          <span className="text-muted-foreground">/</span>
          <span>Perfil & Privacidade</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">Perfil & Privacidade</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Gerencie configurações de perfil e privacidade do WhatsApp
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
              A API de perfil e privacidade permite gerenciar:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Privacidade:</strong> Configure quem pode ver suas informações</li>
              <li><strong>Status/About:</strong> Altere o texto de &quot;recado&quot; do perfil</li>
              <li><strong>Foto de perfil:</strong> Gerencie a foto de perfil (em desenvolvimento)</li>
            </ul>
            <div className="bg-muted/50 rounded-lg p-4 mt-4">
              <p className="text-sm font-semibold mb-2">Configurações de Privacidade disponíveis:</p>
              <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                <li><code>group_add</code> - Quem pode adicionar em grupos</li>
                <li><code>last_seen</code> - Visto por último</li>
                <li><code>status</code> - Status/Stories</li>
                <li><code>profile</code> - Foto de perfil</li>
                <li><code>read_receipts</code> - Confirmação de leitura</li>
                <li><code>online</code> - Status online</li>
                <li><code>call_add</code> - Chamadas</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Endpoints */}
        <section id="endpoints" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
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
