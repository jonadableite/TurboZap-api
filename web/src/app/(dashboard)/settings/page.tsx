"use client";

import { useState, useEffect } from "react";
import { motion } from 'framer-motion';
import {
  Key,
  Server,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Badge } from '@/components/ui';
import { healthApi } from '@/lib/api';
import { useApiConfig } from '@/hooks/useApiConfig';

export default function SettingsPage() {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiUrlInput, setApiUrlInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const { apiKey, apiUrl, updateConfig } = useApiConfig();

  // Load settings on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setApiKeyInput(apiKey || '');
    setApiUrlInput(apiUrl || 'http://localhost:8080');
    checkApiHealth();
  }, [apiKey, apiUrl]);

  const checkApiHealth = async () => {
    setApiStatus('checking');
    try {
      const isOnline = await healthApi.check();
      setApiStatus(isOnline ? 'online' : 'offline');
    } catch {
      setApiStatus('offline');
    }
  };

  const handleSave = () => {
    updateConfig(apiKeyInput.trim() || undefined, apiUrlInput.trim() || undefined);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    checkApiHealth();
  };

  return (
    <>
      <Header
        title="Configurações"
        description="Configure sua conexão com a API TurboZap"
      />

      <div className="px-4 sm:px-8 lg:px-14 py-8 max-w-2xl w-full mx-auto space-y-6">
        {/* API Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    Status da API
                  </CardTitle>
                  <CardDescription>
                    Verifique a conexão com o servidor TurboZap
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    apiStatus === 'online'
                      ? 'success'
                      : apiStatus === 'offline'
                      ? 'danger'
                      : 'warning'
                  }
                  pulse={apiStatus === 'checking'}
                >
                  {apiStatus === 'online'
                    ? 'Online'
                    : apiStatus === 'offline'
                    ? 'Offline'
                    : 'Verificando...'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  {apiStatus === 'online' && (
                    <div className="flex items-center gap-2 text-[var(--rocket-green)]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm">API conectada e funcionando</span>
                    </div>
                  )}
                  {apiStatus === 'offline' && (
                    <div className="flex items-center gap-2 text-[var(--rocket-danger)]">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">
                        Não foi possível conectar à API. Verifique se o servidor está rodando.
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkApiHealth}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Verificar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* API Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Configuração da API
              </CardTitle>
              <CardDescription>
                Configure a URL e chave de autenticação da API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="URL da API"
                value={apiUrlInput}
                onChange={(e) => setApiUrlInput(e.target.value)}
                placeholder="http://localhost:8080"
                leftIcon={<Server className="w-4 h-4" />}
                helperText="URL base do servidor TurboZap"
              />

              <Input
                label="API Key"
                type={showApiKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Sua chave de API"
                leftIcon={<Key className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="p-1 hover:bg-[var(--rocket-gray-700)] rounded"
                  >
                    {showApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                helperText="Chave definida no .env do servidor como API_KEY"
              />

              <div className="pt-4">
                <Button
                  onClick={handleSave}
                  leftIcon={saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  variant={saved ? 'secondary' : 'primary'}
                >
                  {saved ? 'Salvo!' : 'Salvar configurações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="gradient">
            <CardContent>
              <h3 className="font-semibold text-[var(--rocket-gray-50)] mb-2">
                💡 Dica
              </h3>
              <p className="text-sm text-[var(--rocket-gray-300)]">
                Certifique-se de que o servidor TurboZap está rodando antes de usar o painel.
                Execute <code className="px-1.5 py-0.5 bg-[var(--rocket-gray-800)] rounded text-[var(--rocket-purple-light)]">go run ./cmd/api</code> no
                diretório do projeto para iniciar o servidor.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}

