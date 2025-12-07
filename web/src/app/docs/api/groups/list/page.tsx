"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function ListGroupsPage() {
  return (
    <div className="px-8 py-10 max-w-7xl">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Grupos</span>
        <span className="text-muted-foreground">/</span>
        <span>Listar grupos</span>
      </div>

      <ApiDocLayout
        method="GET"
        endpoint="/group/:instance/list"
        title="Listar grupos"
        description="Retorna uma lista de todos os grupos que a instância participa."
        pathParams={[
          {
            name: "instance",
            type: "string",
            required: true,
            description: "Nome da instância",
          },
        ]}
        responses={[
          {
            status: 200,
            description: "Lista de grupos retornada com sucesso",
            example: {
              success: true,
              data: {
                groups: [
                  {
                    id: "120363123456789012@g.us",
                    name: "Meu Grupo",
                    participants_count: 5,
                  },
                ],
              },
            },
          },
        ]}
        exampleResponse={{
          success: true,
          data: {
            groups: [
              {
                id: "120363123456789012@g.us",
                name: "Meu Grupo",
                participants_count: 5,
              },
            ],
          },
        }}
      />
    </div>
  );
}

