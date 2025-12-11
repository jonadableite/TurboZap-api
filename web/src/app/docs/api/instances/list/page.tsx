"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function ListInstancesPage() {
  return (
    <div className="px-8 py-10 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Instâncias</span>
        <span className="text-muted-foreground">/</span>
        <span>Listar instâncias</span>
      </div>

      <ApiDocLayout
        method="GET"
        endpoint="/instance/list"
        title="Listar instâncias"
        description="Retorna uma lista de todas as instâncias criadas na API."
        responses={[
          {
            status: 200,
            description: "Lista de instâncias retornada com sucesso",
            fields: [
              {
                name: "success",
                type: "boolean",
                description: "Indica se a operação foi bem-sucedida",
              },
              {
                name: "data.instances",
                type: "array",
                description: "Array de instâncias",
              },
              {
                name: "data.instances[].id",
                type: "UUID",
                description: "ID único da instância",
              },
              {
                name: "data.instances[].name",
                type: "string",
                description: "Nome da instância",
              },
              {
                name: "data.instances[].status",
                type: "string",
                description: "Status da conexão (disconnected, connecting, qrcode, connected, error)",
              },
            ],
            example: {
              success: true,
              data: {
                instances: [
                  {
                    id: "550e8400-e29b-41d4-a716-446655440000",
                    name: "minha-instancia",
                    status: "connected",
                    created_at: "2024-01-15T10:30:00.000Z",
                  },
                  {
                    id: "660e8400-e29b-41d4-a716-446655440001",
                    name: "outra-instancia",
                    status: "disconnected",
                    created_at: "2024-01-16T11:00:00.000Z",
                  },
                ],
              },
            },
          },
        ]}
        exampleResponse={{
          success: true,
          data: {
            instances: [
              {
                id: "550e8400-e29b-41d4-a716-446655440000",
                name: "minha-instancia",
                status: "connected",
                created_at: "2024-01-15T10:30:00.000Z",
              },
            ],
          },
        }}
      />
    </div>
  );
}

