"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function SendReactionPage() {
  return (
    <div className="px-8 py-10 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Mensagens</span>
        <span className="text-muted-foreground">/</span>
        <span>Enviar reação</span>
      </div>

      <ApiDocLayout
        method="POST"
        endpoint="/message/:instance/reaction"
        title="Enviar reação"
        description="Envia uma reação (emoji) em uma mensagem existente."
        pathParams={[
          {
            name: "instance",
            type: "string",
            required: true,
            description: "Nome da instância que enviará a reação",
          },
        ]}
        bodyParams={[
          {
            name: "to",
            type: "string",
            required: true,
            description: "Número do destinatário (com código do país)",
          },
          {
            name: "message_id",
            type: "string",
            required: true,
            description: "ID da mensagem que receberá a reação",
          },
          {
            name: "reaction",
            type: "string",
            required: true,
            description: "Emoji da reação (ex: 👍, ❤️, 😂)",
          },
        ]}
        responses={[
          {
            status: 200,
            description: "Reação enviada com sucesso",
            example: {
              success: true,
              data: {
                message_id: "3EB0A1B2C3D4E5F6",
                status: "sent",
                timestamp: "2024-01-15T10:35:00.000Z",
              },
            },
          },
        ]}
        exampleResponse={{
          success: true,
          data: {
            message_id: "3EB0A1B2C3D4E5F6",
            status: "sent",
            timestamp: "2024-01-15T10:35:00.000Z",
          },
        }}
      />
    </div>
  );
}

