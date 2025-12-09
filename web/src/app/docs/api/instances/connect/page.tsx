"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function ConnectInstancePage() {
  return (
    <div className="px-8 py-10 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Instâncias</span>
        <span className="text-muted-foreground">/</span>
        <span>Conectar (QR Code)</span>
      </div>

      <ApiDocLayout
        method="POST"
        endpoint="/instance/:name/connect"
        title="Conectar instância"
        description="Inicia o processo de conexão da instância ao WhatsApp. Retorna um QR Code que deve ser escaneado pelo WhatsApp no celular."
        pathParams={[
          {
            name: "name",
            type: "string",
            required: true,
            description: "Nome da instância",
          },
        ]}
        responses={[
          {
            status: 200,
            description: "QR Code gerado com sucesso",
            fields: [
              {
                name: "success",
                type: "boolean",
                description: "Indica se a operação foi bem-sucedida",
              },
              {
                name: "data.qr_code",
                type: "string",
                description: "QR Code em base64 (formato data:image/png;base64,...)",
              },
              {
                name: "data.status",
                type: "string",
                description: "Status da instância (geralmente 'qrcode')",
              },
            ],
            example: {
              success: true,
              data: {
                qr_code: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
                status: "qrcode",
              },
            },
          },
          {
            status: 404,
            description: "Instância não encontrada",
            example: {
              success: false,
              error: {
                code: "INSTANCE_NOT_FOUND",
                message: "Instância não encontrada",
              },
            },
          },
        ]}
        exampleResponse={{
          success: true,
          data: {
            qr_code: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
            status: "qrcode",
          },
        }}
      />
    </div>
  );
}

