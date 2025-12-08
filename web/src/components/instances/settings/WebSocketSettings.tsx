"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Input, Button } from "@/components/ui";
import { CodeBlock } from "@/components/docs/terminal";
import { Radio, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useApiConfig } from "@/hooks/useApiConfig";

interface WebSocketSettingsProps {
  instanceName: string;
}

export function WebSocketSettings({ instanceName: _instanceName }: WebSocketSettingsProps) {
  void _instanceName;
  const { apiUrl } = useApiConfig();
  const [copied, setCopied] = useState(false);
  const wsUrl = `${apiUrl?.replace(/^http/, "ws") || "ws://localhost:8080"}/sse/${instanceName}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(wsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-[var(--rocket-gray-600)] bg-[var(--rocket-gray-800)]/50 backdrop-blur-sm">
        <CardHeader className="border-b border-[var(--rocket-gray-600)]">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--rocket-purple)]/10">
              <Radio className="w-5 h-5 text-[var(--rocket-purple)]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--rocket-gray-100)]">WebSocket</h2>
              <CardDescription className="mt-1">
                Conecte-se via WebSocket para receber eventos em tempo real
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <label className="text-sm font-semibold text-[var(--rocket-gray-100)]">
            URL do WebSocket
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={wsUrl}
              readOnly
              className="bg-[var(--rocket-gray-800)] border-[var(--rocket-gray-600)] font-mono text-sm"
            />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className={copied ? "bg-[var(--rocket-green)]/20 text-[var(--rocket-green)] border border-[var(--rocket-green)]/30" : "hover:bg-[var(--rocket-gray-700)]"}
                leftIcon={copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              >
                {copied ? "Copiado!" : "Copiar"}
              </Button>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-lg bg-[var(--rocket-gray-800)] border border-[var(--rocket-gray-600)]"
        >
          <h4 className="text-sm font-semibold text-[var(--rocket-gray-100)] mb-3">
            Exemplo de uso (JavaScript)
          </h4>
          <CodeBlock
            title=""
            language="javascript"
            code={`const eventSource = new EventSource('${wsUrl}', {
  headers: {
    'X-API-Key': 'sua-api-key'
  }
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Evento:', data);
};`}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-lg bg-[var(--rocket-info)]/10 border border-[var(--rocket-info)]/20 space-y-2"
        >
          <div className="flex items-center gap-2">
            <Badge variant="info">Informação</Badge>
          </div>
          <p className="text-sm text-[var(--rocket-gray-300)] leading-relaxed">
            O WebSocket usa Server-Sent Events (SSE) para enviar eventos em tempo real.
            A conexão é mantida automaticamente e reconecta em caso de perda de conexão.
          </p>
        </motion.div>
      </CardContent>
    </Card>
    </motion.div>
  );
}

