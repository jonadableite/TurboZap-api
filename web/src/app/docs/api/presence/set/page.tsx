"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function SetPresencePage() {
  return (
    <div className="px-8 py-10 max-w-7xl">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Presença</span>
        <span className="text-muted-foreground">/</span>
        <span>Definir presença</span>
      </div>

      <ApiDocLayout
        method="POST"
        endpoint="/presence/:instance/available"
        title="Definir presença"
        description="Define o status de presença no WhatsApp. Pode ser usado para marcar como disponível, indisponível, digitando ou gravando."
        pathParams={[
          {
            name: "instance",
            type: "string",
            required: true,
            description: "Nome da instância",
          },
        ]}
        bodyParams={[
          {
            name: "to",
            type: "string",
            required: true,
            description: "Número do contato (com código do país)",
          },
          {
            name: "presence",
            type: "string",
            required: true,
            description: "Tipo de presença: 'available', 'unavailable', 'composing', 'recording'",
          },
        ]}
        responses={[
          {
            status: 200,
            description: "Presença definida com sucesso",
            example: {
              success: true,
              data: {
                message: "Presença atualizada",
              },
            },
          },
        ]}
        exampleResponse={{
          success: true,
          data: {
            message: "Presença atualizada",
          },
        }}
      />
    </div>
  );
}

