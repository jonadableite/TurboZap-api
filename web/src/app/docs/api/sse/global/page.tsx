"use client";

import { ApiDocLayout } from "@/components/docs/api-doc-layout";
import { CodeBlock } from "@/components/docs/terminal";

export default function SSEGlobalPage() {
  return (
    <div className="px-8 py-10 max-w-7xl">
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <span>API</span>
        <span className="text-muted-foreground">/</span>
        <span>SSE (Eventos)</span>
        <span className="text-muted-foreground">/</span>
        <span>Stream global</span>
      </div>

      <ApiDocLayout
        method="GET"
        endpoint="/sse/"
        title="Stream SSE global"
        description="Estabelece uma conexão Server-Sent Events (SSE) para receber eventos em tempo real de todas as instâncias."
        responses={[
          {
            status: 200,
            description: "Conexão SSE estabelecida (stream contínuo)",
            example: {
              event: "message.received",
              instance: "minha-instancia",
              instance_id: "550e8400-e29b-41d4-a716-446655440000",
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
          instance_id: "550e8400-e29b-41d4-a716-446655440000",
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
          code={`// Conectar ao stream SSE global
const eventSource = new EventSource('http://localhost:8080/sse/', {
  headers: {
    'X-API-Key': 'sua-api-key-global'
  }
});

// Escutar todos os eventos de todas as instâncias
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Evento de', data.instance, ':', data);
};

// Filtrar eventos por instância
eventSource.addEventListener('message.received', (event) => {
  const message = JSON.parse(event.data);
  if (message.instance === 'minha-instancia') {
    console.log('Nova mensagem na minha instância:', message);
  }
});

// Fechar conexão quando necessário
eventSource.close();`}
        />
      </div>
    </div>
  );
}
