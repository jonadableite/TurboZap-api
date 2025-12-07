"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { CodeBlock } from "@/components/docs/terminal";
import { List, MessageCircle, Power } from "lucide-react";
import Link from "next/link";

const tocItems = [
  { id: "visao-geral", title: "Visão geral", level: 2 },
  { id: "endpoints", title: "Endpoints", level: 2 },
  { id: "modelo", title: "Modelo de dados", level: 2 },
  { id: "status", title: "Status da instância", level: 2 },
];

const endpoints = [
  {
    method: "POST" as const,
    path: "/instance/create",
    description: "Criar nova instância",
    href: "/docs/api/instances/create",
  },
  {
    method: "GET" as const,
    path: "/instance/list",
    description: "Listar todas as instâncias",
    href: "/docs/api/instances/list",
  },
  {
    method: "GET" as const,
    path: "/instance/:name/status",
    description: "Status de uma instância",
    href: "/docs/api/instances/status",
  },
  {
    method: "POST" as const,
    path: "/instance/:name/connect",
    description: "Conectar (gera QR Code)",
    href: "/docs/api/instances/connect",
  },
  {
    method: "POST" as const,
    path: "/instance/:name/restart",
    description: "Reiniciar instância",
    href: "/docs/api/instances/restart",
  },
  {
    method: "POST" as const,
    path: "/instance/:name/logout",
    description: "Desconectar instância",
    href: "/docs/api/instances/logout",
  },
  {
    method: "DELETE" as const,
    path: "/instance/:name",
    description: "Deletar instância",
    href: "/docs/api/instances/delete",
  },
];

export default function InstancesReferencePage() {
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 px-8 py-10 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <span>API</span>
          <span className="text-muted-foreground">/</span>
          <span>Instâncias</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">Instâncias</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Gerencie suas conexões WhatsApp com a API de instâncias
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
              Uma <strong>instância</strong> representa uma conexão com um
              número de WhatsApp. Cada instância:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Possui uma API Key única para autenticação</li>
              <li>Mantém sua própria sessão (login persistente)</li>
              <li>Pode ser conectada/desconectada independentemente</li>
              <li>Tem seus próprios webhooks configurados</li>
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
                        : endpoint.method === "POST"
                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
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

        {/* Modelo */}
        <section id="modelo" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Modelo de dados</h2>
          </div>

          <CodeBlock
            title="Instance Object"
            language="json"
            code={`{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "minha-instancia",
  "api_key": "550e8400-e29b-...-ef1234567890",
  "status": "connected",
  "phone_number": "5511999999999",
  "profile_name": "Minha Empresa",
  "profile_pic": "https://pps.whatsapp.net/...",
  "qr_code": null,
  "device_jid": "5511999999999:123@s.whatsapp.net",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:35:00.000Z"
}`}
          />

          <div className="mt-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Campo</th>
                  <th className="text-left py-3 px-4 font-semibold">Tipo</th>
                  <th className="text-left py-3 px-4 font-semibold">
                    Descrição
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-border">
                  <td className="py-3 px-4">
                    <code>id</code>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">UUID</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    Identificador único
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">
                    <code>name</code>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">string</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    Nome da instância (único)
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">
                    <code>api_key</code>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">string</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    Chave de API para autenticação
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">
                    <code>status</code>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">string</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    Status da conexão
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">
                    <code>phone_number</code>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">string?</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    Número conectado
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">
                    <code>profile_name</code>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">string?</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    Nome do perfil
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">
                    <code>qr_code</code>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">string?</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    QR Code para conexão
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Status */}
        <section id="status" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Power className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Status da instância</h2>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
              <span className="px-2 py-1 rounded bg-gray-500/20 text-gray-400 text-xs font-bold">
                disconnected
              </span>
              <span className="text-muted-foreground">
                Instância não está conectada ao WhatsApp
              </span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
              <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs font-bold">
                connecting
              </span>
              <span className="text-muted-foreground">
                Tentando estabelecer conexão
              </span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-bold">
                qrcode
              </span>
              <span className="text-muted-foreground">
                Aguardando leitura do QR Code
              </span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
              <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-bold">
                connected
              </span>
              <span className="text-muted-foreground">
                Conectado e pronto para enviar/receber mensagens
              </span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
              <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-bold">
                error
              </span>
              <span className="text-muted-foreground">Erro na conexão</span>
            </div>
          </div>
        </section>
      </div>

      <OnThisPage items={tocItems} />
    </div>
  );
}
