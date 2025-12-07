"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";

export default function SendListPage() {
  return (
    <div className="px-8 py-10 max-w-7xl">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>Mensagens</span>
        <span className="text-muted-foreground">/</span>
        <span>Enviar lista</span>
      </div>

      <ApiDocLayout
        method="POST"
        endpoint="/message/:instance/list"
        title="Enviar mensagem de lista"
        description="Envia uma mensagem interativa com lista selecionável. As mensagens são automaticamente envolvidas em ViewOnceMessage/FutureProofMessage para garantir renderização correta em todos os dispositivos."
        pathParams={[
          {
            name: "instance",
            type: "string",
            required: true,
            description: "Nome da instância que enviará a mensagem",
          },
        ]}
        bodyParams={[
          {
            name: "to",
            type: "string",
            required: true,
            description: "Número do destinatário (com código do país)",
          },
          {
            name: "title",
            type: "string",
            required: true,
            description: "Título da lista",
          },
          {
            name: "description",
            type: "string",
            required: false,
            description: "Descrição da lista",
          },
          {
            name: "button_text",
            type: "string",
            required: true,
            description: "Texto do botão que abre a lista",
          },
          {
            name: "footer",
            type: "string",
            required: false,
            description: "Texto do rodapé",
          },
          {
            name: "sections",
            type: "array",
            required: true,
            description: "Array com 1 ou mais seções",
          },
          {
            name: "sections[].title",
            type: "string",
            required: true,
            description: "Título da seção",
          },
          {
            name: "sections[].rows",
            type: "array",
            required: true,
            description: "Array com as linhas da seção (pelo menos 1 linha)",
          },
          {
            name: "sections[].rows[].id",
            type: "string",
            required: false,
            description: "ID único da linha (gerado automaticamente se vazio)",
          },
          {
            name: "sections[].rows[].title",
            type: "string",
            required: true,
            description: "Título da linha",
          },
          {
            name: "sections[].rows[].description",
            type: "string",
            required: false,
            description: "Descrição da linha",
          },
        ]}
        responses={[
          {
            status: 200,
            description: "Mensagem de lista enviada com sucesso",
            example: {
              success: true,
              data: {
                message_id: "3EB0A1B2C3D4E5F6",
                status: "sent",
                timestamp: "2024-01-15T10:35:00.000Z",
              },
            },
          },
        ]}
        exampleResponse={{
          success: true,
          data: {
            message_id: "3EB0A1B2C3D4E5F6",
            status: "sent",
            timestamp: "2024-01-15T10:35:00.000Z",
          },
        }}
      />
    </div>
  );
}

