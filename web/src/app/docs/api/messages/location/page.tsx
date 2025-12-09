"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function SendLocationPage() {
  return (
    <div className="px-8 py-10 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Mensagens</span>
        <span className="text-muted-foreground">/</span>
        <span>Enviar localização</span>
      </div>

      <ApiDocLayout
        method="POST"
        endpoint="/message/:instance/location"
        title="Enviar localização"
        description="Envia uma localização geográfica através do WhatsApp."
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
            name: "latitude",
            type: "number",
            required: true,
            description: "Latitude da localização",
          },
          {
            name: "longitude",
            type: "number",
            required: true,
            description: "Longitude da localização",
          },
          {
            name: "name",
            type: "string",
            required: false,
            description: "Nome do local",
          },
          {
            name: "address",
            type: "string",
            required: false,
            description: "Endereço do local",
          },
        ]}
        responses={[
          {
            status: 200,
            description: "Localização enviada com sucesso",
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

