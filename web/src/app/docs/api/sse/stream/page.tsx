"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";
import { CodeBlock } from "@/components/docs/terminal";

export default function SSEStreamPage() {
  return (
    <div className="px-8 py-10 max-w-7xl">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>SSE (Eventos)</span>
        <span className="text-muted-foreground">/</span>
        <span>Stream de instância</span>
      </div>

      <ApiDocLayout
        method="GET"
        endpoint="/sse/:instance"
        title="Stream SSE para uma instância"
        description="Estabelece uma conexão Server-Sent Events (SSE) para receber eventos em tempo real de uma instância específica."
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
            description: "Conexão SSE estabelecida (stream contínuo)",
            example: {
              event: "message.received",
              instance: "minha-instancia",
              data: {
                message_id: "3EB0A1B2C3D4E5F6",
                from: "5511999999999@s.whatsapp.net",
                text: "Olá!",
              },
            },
          },
        ]}
        exampleResponse={{
          event: "message.received",
          instance: "minha-instancia",
          data: {
            message_id: "3EB0A1B2C3D4E5F6",
            from: "5511999999999@s.whatsapp.net",
            text: "Olá!",
          },
        }}
      />

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Exemplo de uso</h2>
        <CodeBlock
          title="JavaScript"
          language="javascript"
          code={`// Conectar ao stream SSE
const eventSource = new EventSource('http://localhost:8080/sse/minha-instancia', {
  headers: {
    'X-API-Key': 'sua-api-key'
  }
});

// Escutar todos os eventos
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Evento recebido:', data);
};

// Escutar eventos específicos
eventSource.addEventListener('message.received', (event) => {
  const message = JSON.parse(event.data);
  console.log('Nova mensagem:', message);
});

eventSource.addEventListener('connection.update', (event) => {
  const update = JSON.parse(event.data);
  console.log('Status da conexão:', update.status);
});

// Fechar conexão quando necessário
eventSource.close();`}
        />
      </div>
    </div>
  );
}
