"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function InstanceStatusPage() {
  return (
    <div className="px-8 py-10 max-w-7xl">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Instâncias</span>
        <span className="text-muted-foreground">/</span>
        <span>Status da instância</span>
      </div>

      <ApiDocLayout
        method="GET"
        endpoint="/instance/:name/status"
        title="Status da instância"
        description="Retorna o status atual de uma instância específica, incluindo informações sobre a conexão e o perfil do WhatsApp."
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
            description: "Status da instância retornado com sucesso",
            fields: [
              {
                name: "success",
                type: "boolean",
                description: "Indica se a operação foi bem-sucedida",
              },
              {
                name: "data.status",
                type: "string",
                description: "Status da conexão (disconnected, connecting, qrcode, connected, error)",
              },
              {
                name: "data.phone_number",
                type: "string",
                description: "Número de telefone conectado (se disponível)",
              },
              {
                name: "data.profile_name",
                type: "string",
                description: "Nome do perfil do WhatsApp",
              },
            ],
            example: {
              success: true,
              data: {
                status: "connected",
                phone_number: "5511999999999",
                profile_name: "Minha Empresa",
                profile_pic: "https://pps.whatsapp.net/...",
                device_jid: "5511999999999:123@s.whatsapp.net",
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
            status: "connected",
            phone_number: "5511999999999",
            profile_name: "Minha Empresa",
          },
        }}
      />
    </div>
  );
}

