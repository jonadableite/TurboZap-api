'use client';

import { motion } from 'framer-motion';
import {
  BookOpen,
  Code,
  Smartphone,
  MessageSquare,
  Webhook,
  Users,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { Header } from '@/components/layout';
import { Card, CardContent, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

const docs = [
  {
    title: 'Instâncias',
    description: 'Criar, listar e gerenciar instâncias WhatsApp',
    icon: <Smartphone className="w-6 h-6" />,
    color: 'var(--rocket-purple)',
    endpoints: [
      { method: 'POST', path: '/instance/create', description: 'Criar nova instância' },
      { method: 'GET', path: '/instance/list', description: 'Listar todas instâncias' },
      { method: 'GET', path: '/instance/:name', description: 'Obter instância por nome' },
      { method: 'GET', path: '/instance/:name/qrcode', description: 'Obter QR Code' },
      { method: 'POST', path: '/instance/:name/connect', description: 'Conectar instância' },
      { method: 'DELETE', path: '/instance/:name', description: 'Deletar instância' },
    ],
  },
  {
    title: 'Mensagens',
    description: 'Enviar diferentes tipos de mensagens',
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'var(--rocket-green)',
    endpoints: [
      { method: 'POST', path: '/message/:instance/text', description: 'Enviar texto' },
      { method: 'POST', path: '/message/:instance/media', description: 'Enviar mídia' },
      { method: 'POST', path: '/message/:instance/audio', description: 'Enviar áudio' },
      { method: 'POST', path: '/message/:instance/button', description: 'Enviar botões' },
      { method: 'POST', path: '/message/:instance/list', description: 'Enviar lista' },
    ],
  },
  {
    title: 'Contatos',
    description: 'Gerenciar contatos e verificar números',
    icon: <Users className="w-6 h-6" />,
    color: 'var(--rocket-info)',
    endpoints: [
      { method: 'POST', path: '/contact/:instance/check', description: 'Verificar número' },
      { method: 'GET', path: '/contact/:instance/:jid/info', description: 'Info do contato' },
      { method: 'GET', path: '/contact/:instance/list', description: 'Listar contatos' },
    ],
  },
  {
    title: 'Webhooks',
    description: 'Configurar notificações em tempo real',
    icon: <Webhook className="w-6 h-6" />,
    color: 'var(--rocket-warning)',
    endpoints: [
      { method: 'POST', path: '/webhook/set', description: 'Configurar webhook' },
      { method: 'GET', path: '/webhook/:instance', description: 'Obter webhook' },
      { method: 'DELETE', path: '/webhook/:instance', description: 'Remover webhook' },
    ],
  },
];

const methodColors: Record<string, string> = {
  GET: 'bg-[var(--rocket-green)]/20 text-[var(--rocket-green)]',
  POST: 'bg-[var(--rocket-info)]/20 text-[var(--rocket-info)]',
  PUT: 'bg-[var(--rocket-warning)]/20 text-[var(--rocket-warning)]',
  DELETE: 'bg-[var(--rocket-danger)]/20 text-[var(--rocket-danger)]',
};

export default function DocsPage() {
  return (
    <>
      <Header
        title="Documentação"
        description="Referência da API TurboZap"
      />

      <div className="px-4 sm:px-8 lg:px-14 py-8 space-y-8 max-w-6xl mx-auto w-full">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
        >
          <Card variant="gradient">
            <CardContent className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--rocket-purple)]/20 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-[var(--rocket-purple)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--rocket-gray-50)] mb-2">
                  API Reference
                </h2>
                <p className="text-[var(--rocket-gray-300)] mb-4">
                  A TurboZap API permite você conectar e gerenciar múltiplas instâncias do WhatsApp,
                  enviar mensagens, receber eventos via webhook e muito mais.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-[var(--rocket-gray-400)]">
                    <Shield className="w-4 h-4" />
                    <span>Autenticação via API Key</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--rocket-gray-400)]">
                    <Code className="w-4 h-4" />
                    <span>REST API</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Auth info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent>
              <h3 className="font-semibold text-[var(--rocket-gray-50)] mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[var(--rocket-purple)]" />
                Autenticação
              </h3>
              <p className="text-sm text-[var(--rocket-gray-300)] mb-4">
                Todas as requisições precisam incluir a API Key no header:
              </p>
              <div className="bg-[var(--rocket-gray-900)] rounded-lg p-4 font-mono text-sm">
                <div className="text-[var(--rocket-gray-400)]"># Header</div>
                <div className="text-[var(--rocket-green)]">
                  X-API-Key: <span className="text-[var(--rocket-gray-300)]">sua-api-key</span>
                </div>
                <div className="mt-2 text-[var(--rocket-gray-400)]"># Ou</div>
                <div className="text-[var(--rocket-green)]">
                  Authorization: <span className="text-[var(--rocket-gray-300)]">Bearer sua-api-key</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Endpoints by category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {docs.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 2) }}
            >
              <Card className="h-full">
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <span style={{ color: category.color }}>{category.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--rocket-gray-50)]">
                        {category.title}
                      </h3>
                      <p className="text-sm text-[var(--rocket-gray-400)]">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {category.endpoints.map((endpoint) => (
                      <div
                        key={endpoint.path}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--rocket-gray-700)] transition-colors"
                      >
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs font-medium rounded',
                            methodColors[endpoint.method]
                          )}
                        >
                          {endpoint.method}
                        </span>
                        <code className="text-sm text-[var(--rocket-gray-300)] flex-1">
                          {endpoint.path}
                        </code>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Example */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardContent>
              <h3 className="font-semibold text-[var(--rocket-gray-50)] mb-3 flex items-center gap-2">
                <Code className="w-5 h-5 text-[var(--rocket-purple)]" />
                Exemplo: Criar Instância
              </h3>
              <div className="bg-[var(--rocket-gray-900)] rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <div className="text-[var(--rocket-gray-400)]"># cURL</div>
                <pre className="text-[var(--rocket-gray-300)] whitespace-pre-wrap">
{`curl -X POST http://localhost:8080/instance/create \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sua-api-key" \\
  -d '{"name": "minha-instancia"}'`}
                </pre>
              </div>
              <div className="mt-4 bg-[var(--rocket-gray-900)] rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <div className="text-[var(--rocket-gray-400)]"># Response</div>
                <pre className="text-[var(--rocket-green)]">
{`{
  "success": true,
  "data": {
    "instance": {
      "id": "uuid",
      "name": "minha-instancia",
      "status": "disconnected"
    }
  }
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}

