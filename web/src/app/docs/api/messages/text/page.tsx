"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function SendTextPage() {
  return (
    <div className="px-8 py-10 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Mensagens</span>
        <span className="text-muted-foreground">/</span>
        <span>Enviar texto</span>
      </div>

      <ApiDocLayout
        method="POST"
        endpoint="/message/:instance/text"
        title="Enviar mensagem de texto"
        description="Envia uma mensagem de texto simples para um número do WhatsApp."
        pathParams={[
          {
            name: "instance",
            type: "string",
            required: true,
            description: "Nome da instância que enviará a mensagem",
          },
        ]}
        bodyParams={[
          {
            name: "to",
            type: "string",
            required: true,
            description: "Número do destinatário (com código do país, ex: 5511999999999)",
          },
          {
            name: "text",
            type: "string",
            required: true,
            description: "Texto da mensagem a ser enviada",
          },
        ]}
        responses={[
          {
            status: 200,
            description: "Mensagem enviada com sucesso",
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

