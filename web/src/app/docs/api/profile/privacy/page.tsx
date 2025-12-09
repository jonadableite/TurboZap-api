"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function GetPrivacyPage() {
  return (
    <div className="px-8 py-10 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Perfil & Privacidade</span>
        <span className="text-muted-foreground">/</span>
        <span>Obter privacidade</span>
      </div>

      <ApiDocLayout
        method="GET"
        endpoint="/profile/:instance/privacy"
        title="Obter configurações de privacidade"
        description="Retorna as configurações atuais de privacidade do perfil."
        pathParams={[
          {
            name: "instance",
            type: "string",
            required: true,
            description: "Nome da instância",
          },
        ]}
        responses={[
          {
            status: 200,
            description: "Configurações de privacidade retornadas",
            example: {
              success: true,
              data: {
                group_add: "all",
                last_seen: "contacts",
                status: "contacts",
                profile: "contacts",
                read_receipts: "all",
                online: "all",
                call_add: "all",
              },
            },
          },
        ]}
        exampleResponse={{
          success: true,
          data: {
            group_add: "all",
            last_seen: "contacts",
            status: "contacts",
            profile: "contacts",
            read_receipts: "all",
            online: "all",
            call_add: "all",
          },
        }}
      />
    </div>
  );
}
