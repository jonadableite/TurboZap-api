"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function SetPrivacyPage() {
  return (
    <div className="px-8 py-10 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Perfil & Privacidade</span>
        <span className="text-muted-foreground">/</span>
        <span>Alterar privacidade</span>
      </div>

      <ApiDocLayout
        method="POST"
        endpoint="/profile/:instance/privacy"
        title="Alterar configuração de privacidade"
        description="Altera uma configuração específica de privacidade do perfil."
        pathParams={[
          {
            name: "instance",
            type: "string",
            required: true,
            description: "Nome da instância",
          },
        ]}
        bodyParams={[
          {
            name: "setting",
            type: "string",
            required: true,
            description: "Configuração a alterar: group_add, last_seen, status, profile, read_receipts, online, call_add",
          },
          {
            name: "value",
            type: "string",
            required: true,
            description: "Valor da configuração. Valores possíveis: 'all', 'contacts', 'contact_blacklist', 'none', 'match_last_seen', 'known'",
          },
        ]}
        responses={[
          {
            status: 200,
            description: "Privacidade alterada com sucesso",
            example: {
              success: true,
              data: {
                message: "Configuração de privacidade atualizada",
                setting: "last_seen",
                value: "contacts",
              },
            },
          },
        ]}
        exampleResponse={{
          success: true,
          data: {
            message: "Configuração de privacidade atualizada",
            setting: "last_seen",
            value: "contacts",
          },
        }}
      />
    </div>
  );
}
