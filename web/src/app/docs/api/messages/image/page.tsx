"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function SendImagePage() {
  return (
    <div className="px-8 py-10 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Mensagens</span>
        <span className="text-muted-foreground">/</span>
        <span>Enviar imagem</span>
      </div>

      <ApiDocLayout
        method="POST"
        endpoint="/message/:instance/media"
        title="Enviar imagem"
        description="Envia uma imagem através do WhatsApp. Suporta formatos JPG, PNG, GIF e WebP."
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
            name: "media_url",
            type: "string",
            required: false,
            description: "URL da imagem a ser enviada",
          },
          {
            name: "base64",
            type: "string",
            required: false,
            description: "Imagem em base64 (alternativa a media_url)",
          },
          {
            name: "caption",
            type: "string",
            required: false,
            description: "Legenda da imagem",
          },
          {
            name: "mime_type",
            type: "string",
            required: false,
            description: "Tipo MIME da imagem (ex: image/jpeg, image/png)",
          },
        ]}
        responses={[
          {
            status: 200,
            description: "Imagem enviada com sucesso",
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

