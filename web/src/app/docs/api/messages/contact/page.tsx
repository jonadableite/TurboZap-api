"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function SendContactPage() {
  return (
    <div className="px-8 py-10 max-w-7xl">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Mensagens</span>
        <span className="text-muted-foreground">/</span>
        <span>Enviar contato</span>
      </div>

      <ApiDocLayout
        method="POST"
        endpoint="/message/:instance/contact"
        title="Enviar cartão de contato"
        description="Envia um cartão de contato (vCard) através do WhatsApp."
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
            name: "name",
            type: "string",
            required: true,
            description: "Nome do contato",
          },
          {
            name: "phone",
            type: "string",
            required: true,
            description: "Número de telefone do contato (com código do país)",
          },
          {
            name: "organization",
            type: "string",
            required: false,
            description: "Organização/empresa do contato",
          },
          {
            name: "email",
            type: "string",
            required: false,
            description: "Email do contato",
          },
        ]}
        responses={[
          {
            status: 200,
            description: "Contato enviado com sucesso",
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

