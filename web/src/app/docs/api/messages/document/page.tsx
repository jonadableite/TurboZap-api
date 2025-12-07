"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function SendDocumentPage() {
  return (
    <div className="px-8 py-10 max-w-7xl">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Mensagens</span>
        <span className="text-muted-foreground">/</span>
        <span>Enviar documento</span>
      </div>

      <ApiDocLayout
        method="POST"
        endpoint="/message/:instance/media"
        title="Enviar documento"
        description="Envia um documento (PDF, DOC, XLS, etc.) através do WhatsApp."
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
            description: "URL do documento a ser enviado",
          },
          {
            name: "base64",
            type: "string",
            required: false,
            description: "Documento em base64 (alternativa a media_url)",
          },
          {
            name: "file_name",
            type: "string",
            required: false,
            description: "Nome do arquivo (ex: documento.pdf)",
          },
          {
            name: "caption",
            type: "string",
            required: false,
            description: "Legenda do documento",
          },
          {
            name: "mime_type",
            type: "string",
            required: false,
            description: "Tipo MIME do documento (ex: application/pdf)",
          },
        ]}
        responses={[
          {
            status: 200,
            description: "Documento enviado com sucesso",
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

