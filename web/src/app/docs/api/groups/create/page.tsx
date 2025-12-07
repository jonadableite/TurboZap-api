"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function CreateGroupPage() {
  return (
    <div className="px-8 py-10 max-w-7xl">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Grupos</span>
        <span className="text-muted-foreground">/</span>
        <span>Criar grupo</span>
      </div>

      <ApiDocLayout
        method="POST"
        endpoint="/group/:instance/create"
        title="Criar grupo"
        description="Cria um novo grupo no WhatsApp com participantes especificados."
        pathParams={[
          {
            name: "instance",
            type: "string",
            required: true,
            description: "Nome da instância que criará o grupo",
          },
        ]}
        bodyParams={[
          {
            name: "name",
            type: "string",
            required: true,
            description: "Nome do grupo",
          },
          {
            name: "participants",
            type: "array",
            required: true,
            description: "Array de números de telefone dos participantes (com código do país)",
          },
        ]}
        responses={[
          {
            status: 200,
            description: "Grupo criado com sucesso",
            example: {
              success: true,
              data: {
                group_id: "120363123456789012@g.us",
                name: "Meu Grupo",
                participants: ["5511999999999@s.whatsapp.net"],
              },
            },
          },
        ]}
        exampleResponse={{
          success: true,
          data: {
            group_id: "120363123456789012@g.us",
            name: "Meu Grupo",
            participants: ["5511999999999@s.whatsapp.net"],
          },
        }}
      />
    </div>
  );
}

