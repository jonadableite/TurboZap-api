"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function CreateInstancePage() {
  return (
    <div className="px-8 py-10 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Instâncias</span>
        <span className="text-muted-foreground">/</span>
        <span>Criar instância</span>
      </div>

      <ApiDocLayout
        method="POST"
        endpoint="/instance/create"
        title="Criar instância"
        description="Cria uma nova instância do WhatsApp. Cada instância possui uma API Key única e mantém sua própria sessão."
        bodyParams={[
          {
            name: "name",
            type: "string",
            required: true,
            description: "Nome único da instância (usado para identificação)",
          },
        ]}
        responses={[
          {
            status: 200,
            description: "Instância criada com sucesso",
            fields: [
              {
                name: "success",
                type: "boolean",
                description: "Indica se a operação foi bem-sucedida",
              },
              {
                name: "data.instance.id",
                type: "UUID",
                description: "ID único da instância",
              },
              {
                name: "data.instance.name",
                type: "string",
                description: "Nome da instância",
              },
              {
                name: "data.instance.api_key",
                type: "string",
                description: "Chave de API única para esta instância",
              },
              {
                name: "data.instance.status",
                type: "string",
                description: "Status inicial (geralmente 'disconnected')",
              },
              {
                name: "data.instance.created_at",
                type: "ISO8601",
                description: "Data de criação da instância",
              },
            ],
            example: {
              success: true,
              data: {
                instance: {
                  id: "550e8400-e29b-41d4-a716-446655440000",
                  name: "minha-instancia",
                  api_key: "550e8400-e29b-41d4-a716-446655440000",
                  status: "disconnected",
                  created_at: "2024-01-15T10:30:00.000Z",
                },
              },
            },
          },
          {
            status: 400,
            description: "Erro de validação",
            example: {
              success: false,
              error: {
                code: "VALIDATION_ERROR",
                message: "Nome da instância é obrigatório",
              },
            },
          },
          {
            status: 409,
            description: "Instância já existe",
            example: {
              success: false,
              error: {
                code: "INSTANCE_EXISTS",
                message: "Uma instância com este nome já existe",
              },
            },
          },
        ]}
        exampleResponse={{
          success: true,
          data: {
            instance: {
              id: "550e8400-e29b-41d4-a716-446655440000",
              name: "minha-instancia",
              api_key: "550e8400-e29b-41d4-a716-446655440000",
              status: "disconnected",
              created_at: "2024-01-15T10:30:00.000Z",
            },
          },
        }}
      />
    </div>
  );
}

