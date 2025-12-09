"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function SendAudioPage() {
  return (
    <div className="px-8 py-10 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Mensagens</span>
        <span className="text-muted-foreground">/</span>
        <span>Enviar áudio</span>
      </div>

      <ApiDocLayout
        method="POST"
        endpoint="/message/:instance/audio"
        title="Enviar áudio"
        description="Envia uma mensagem de áudio ou voz através do WhatsApp. Suporta formatos OGG, MP3, WAV e outros."
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
            description: "URL do áudio a ser enviado",
          },
          {
            name: "base64",
            type: "string",
            required: false,
            description: "Áudio em base64 (alternativa a media_url)",
          },
          {
            name: "ptt",
            type: "boolean",
            required: false,
            description: "Se true, envia como mensagem de voz (PTT - Push to Talk)",
            default: "false",
          },
          {
            name: "mime_type",
            type: "string",
            required: false,
            description: "Tipo MIME do áudio (ex: audio/ogg, audio/mp3)",
          },
        ]}
        responses={[
          {
            status: 200,
            description: "Áudio enviado com sucesso",
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

