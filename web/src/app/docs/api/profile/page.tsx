"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { Terminal, TypingAnimation, AnimatedSpan, CodeBlock } from "@/components/docs/terminal";
import { Shield, Eye, User, Lock } from "lucide-react";

const tocItems = [
  { id: "intro", title: "Introdução", level: 2 },
  { id: "endpoints", title: "Endpoints", level: 2 },
  { id: "privacidade", title: "Configurações de Privacidade", level: 2 },
];

export default function ProfileDocsPage() {
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 px-8 py-10 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <span>API Reference</span>
          <span>/</span>
          <span>Profile</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">Perfil e Privacidade</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Gerencie configurações de privacidade e informações do perfil do WhatsApp.
        </p>

        <section id="intro" className="mb-12">
          <p className="text-lg text-muted-foreground mb-6">
            A API de Perfil permite que você consulte e altere as configurações de privacidade da sua conta WhatsApp,
            bem como atualize seu recado (about/status).
          </p>
        </section>

        <section id="endpoints" className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Endpoints Disponíveis</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-6 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Consultar Privacidade</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Obtém as configurações atuais de privacidade.
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded">GET /profile/:instance/privacy</code>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Alterar Privacidade</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Modifica uma configuração de privacidade específica.
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded">POST /profile/:instance/privacy</code>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Atualizar Recado</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Atualiza o texto de "recado" (status/about) do perfil.
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded">POST /profile/:instance/status</code>
            </div>
          </div>
        </section>

        <section id="privacidade" className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Configurações de Privacidade</h2>
          <p className="text-muted-foreground mb-6">
            Abaixo estão as opções disponíveis para cada tipo de configuração de privacidade:
          </p>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Configuração (Setting)</th>
                  <th className="px-6 py-4 font-medium">Descrição</th>
                  <th className="px-6 py-4 font-medium">Valores Permitidos (Value)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="bg-card">
                  <td className="px-6 py-4 font-mono text-primary">last_seen</td>
                  <td className="px-6 py-4">Quem pode ver seu "visto por último"</td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">all, contacts, contact_blacklist, none</td>
                </tr>
                <tr className="bg-card/50">
                  <td className="px-6 py-4 font-mono text-primary">profile</td>
                  <td className="px-6 py-4">Quem pode ver sua foto de perfil</td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">all, contacts, contact_blacklist, none</td>
                </tr>
                <tr className="bg-card">
                  <td className="px-6 py-4 font-mono text-primary">status</td>
                  <td className="px-6 py-4">Quem pode ver seus status/stories</td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">all, contacts, contact_blacklist, none</td>
                </tr>
                <tr className="bg-card/50">
                  <td className="px-6 py-4 font-mono text-primary">read_receipts</td>
                  <td className="px-6 py-4">Confirmação de leitura (azul)</td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">all, none</td>
                </tr>
                <tr className="bg-card">
                  <td className="px-6 py-4 font-mono text-primary">group_add</td>
                  <td className="px-6 py-4">Quem pode te adicionar em grupos</td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">all, contacts, contact_blacklist, none</td>
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
