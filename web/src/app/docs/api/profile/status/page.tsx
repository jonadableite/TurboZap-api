"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function SetStatusPage() {
  return (
    <div className="px-8 py-10 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Perfil & Privacidade</span>
        <span className="text-muted-foreground">/</span>
        <span>Alterar recado/about</span>
      </div>

      <ApiDocLayout
        method="POST"
        endpoint="/profile/:instance/status"
        title="Alterar recado/about"
        description="Altera o texto de 'recado' ou 'about' do perfil do WhatsApp."
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
            name: "status",
            type: "string",
            required: true,
            description: "Texto do recado/about (máximo 139 caracteres)",
          },
        ]}
        responses={[
          {
            status: 200,
            description: "Recado alterado com sucesso",
            example: {
              success: true,
              data: {
                message: "Recado atualizado",
                status: "Disponível para atendimento",
              },
            },
          },
        ]}
        exampleResponse={{
          success: true,
          data: {
            message: "Recado atualizado",
            status: "Disponível para atendimento",
          },
        }}
      />
    </div>
  );
}
