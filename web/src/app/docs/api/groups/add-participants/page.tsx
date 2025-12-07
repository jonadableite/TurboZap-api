"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function AddParticipantsPage() {
  return (
    <div className="px-8 py-10 max-w-7xl">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Grupos</span>
        <span className="text-muted-foreground">/</span>
        <span>Adicionar participantes</span>
      </div>

      <ApiDocLayout
        method="POST"
        endpoint="/group/:instance/:groupId/participants/add"
        title="Adicionar participantes"
        description="Adiciona participantes a um grupo existente."
        pathParams={[
          {
            name: "instance",
            type: "string",
            required: true,
            description: "Nome da instância",
          },
          {
            name: "groupId",
            type: "string",
            required: true,
            description: "ID do grupo (JID)",
          },
        ]}
        bodyParams={[
          {
            name: "participants",
            type: "array",
            required: true,
            description: "Array de números de telefone dos participantes a adicionar (com código do país)",
          },
        ]}
        responses={[
          {
            status: 200,
            description: "Participantes adicionados com sucesso",
            example: {
              success: true,
              data: {
                message: "Participantes adicionados",
                added: ["5511999999999@s.whatsapp.net"],
              },
            },
          },
        ]}
        exampleResponse={{
          success: true,
          data: {
            message: "Participantes adicionados",
            added: ["5511999999999@s.whatsapp.net"],
          },
        }}
      />
    </div>
  );
}

