"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function RestartInstancePage() {
  return (
    <div className="px-8 py-10 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Instâncias</span>
        <span className="text-muted-foreground">/</span>
        <span>Reiniciar instância</span>
      </div>

      <ApiDocLayout
        method="POST"
        endpoint="/instance/:name/restart"
        title="Reiniciar instância"
        description="Reinicia a conexão de uma instância. Útil quando a conexão está com problemas ou travada."
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
            description: "Instância reiniciada com sucesso",
            example: {
              success: true,
              data: {
                message: "Instância reiniciada com sucesso",
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
            message: "Instância reiniciada com sucesso",
            status: "disconnected",
          },
        }}
      />
    </div>
  );
}

