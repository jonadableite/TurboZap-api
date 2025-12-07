"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function DeleteInstancePage() {
  return (
    <div className="px-8 py-10 max-w-7xl">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Instâncias</span>
        <span className="text-muted-foreground">/</span>
        <span>Deletar instância</span>
      </div>

      <ApiDocLayout
        method="DELETE"
        endpoint="/instance/:name"
        title="Deletar instância"
        description="Remove permanentemente uma instância e todos os seus dados. Esta ação não pode ser desfeita."
        pathParams={[
          {
            name: "name",
            type: "string",
            required: true,
            description: "Nome da instância a ser deletada",
          },
        ]}
        responses={[
          {
            status: 200,
            description: "Instância deletada com sucesso",
            example: {
              success: true,
              data: {
                message: "Instância deletada com sucesso",
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
            message: "Instância deletada com sucesso",
          },
        }}
      />
    </div>
  );
}

