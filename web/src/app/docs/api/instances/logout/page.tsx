"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function LogoutInstancePage() {
  return (
    <div className="px-8 py-10 max-w-7xl">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Instâncias</span>
        <span className="text-muted-foreground">/</span>
        <span>Desconectar</span>
      </div>

      <ApiDocLayout
        method="POST"
        endpoint="/instance/:name/logout"
        title="Desconectar instância"
        description="Desconecta a instância do WhatsApp, encerrando a sessão. A instância permanece criada, mas precisará ser conectada novamente."
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
            description: "Instância desconectada com sucesso",
            example: {
              success: true,
              data: {
                message: "Instância desconectada com sucesso",
                status: "disconnected",
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
            message: "Instância desconectada com sucesso",
            status: "disconnected",
          },
        }}
      />
    </div>
  );
}

