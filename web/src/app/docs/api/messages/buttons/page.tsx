"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function SendButtonsPage() {
  return (
    <div className="px-8 py-10 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Mensagens</span>
        <span className="text-muted-foreground">/</span>
        <span>Enviar botões</span>
      </div>

      <ApiDocLayout
        method="POST"
        endpoint="/message/:instance/button"
        title="Enviar mensagem com botões"
        description="Envia uma mensagem interativa com até 3 botões. As mensagens são automaticamente envolvidas em ViewOnceMessage/FutureProofMessage para garantir renderização correta em todos os dispositivos."
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
            description: "Número do destinatário (com código do país)",
          },
          {
            name: "text",
            type: "string",
            required: true,
            description: "Texto principal da mensagem",
          },
          {
            name: "footer",
            type: "string",
            required: false,
            description: "Texto do rodapé",
          },
          {
            name: "buttons",
            type: "array",
            required: true,
            description: "Array com 1-3 botões",
          },
          {
            name: "buttons[].id",
            type: "string",
            required: false,
            description: "ID único do botão (gerado automaticamente se vazio)",
          },
          {
            name: "buttons[].text",
            type: "string",
            required: true,
            description: "Texto exibido no botão",
          },
          {
            name: "header",
            type: "object",
            required: false,
            description: "Cabeçalho da mensagem (text, image, video ou document)",
          },
        ]}
        responses={[
          {
            status: 200,
            description: "Mensagem com botões enviada com sucesso",
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

