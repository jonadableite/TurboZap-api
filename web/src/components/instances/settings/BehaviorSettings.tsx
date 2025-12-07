"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Badge } from "@/components/ui";
import { Save, RefreshCw, Settings, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui";

interface BehaviorSettingsProps {
  instanceName: string;
}

export function BehaviorSettings({ instanceName }: BehaviorSettingsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [reconnectInterval, setReconnectInterval] = useState(5);
  const [maxReconnectAttempts, setMaxReconnectAttempts] = useState(10);
  const { showToast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implementar salvamento
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast("Configurações de comportamento salvas com sucesso!", "success");
    } catch (error) {
      showToast("Erro ao salvar configurações", "error");
    } finally {
      setIsSaving(false);
    }
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
              <Settings className="w-5 h-5 text-[var(--rocket-purple)]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--rocket-gray-100)]">Comportamento</h2>
              <CardDescription className="mt-1">
                Configure o comportamento padrão da instância
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
        {/* Auto Reconnect */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-lg border border-[var(--rocket-gray-600)] bg-[var(--rocket-gray-800)]/30 space-y-3"
        >
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[var(--rocket-gray-100)]">
              Reconexão Automática
            </label>
            <Badge variant={autoReconnect ? "success" : "default"} pulse={autoReconnect}>
              {autoReconnect ? "Ativado" : "Desativado"}
            </Badge>
          </div>
          <p className="text-sm text-[var(--rocket-gray-400)]">
            Reconecta automaticamente quando a conexão é perdida
          </p>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={autoReconnect}
                onChange={(e) => setAutoReconnect(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-11 h-6 rounded-full transition-all duration-300 ${
                  autoReconnect
                    ? "bg-[var(--rocket-purple)]"
                    : "bg-[var(--rocket-gray-600)]"
                }`}
              >
                <motion.div
                  className="w-5 h-5 bg-white rounded-full mt-0.5 ml-0.5"
                  animate={{
                    x: autoReconnect ? 20 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
            </div>
            <span className="text-sm text-[var(--rocket-gray-300)] group-hover:text-[var(--rocket-gray-100)] transition-colors">
              Habilitar reconexão automática
            </span>
          </label>
        </motion.div>

        {/* Reconnect Interval */}
        <AnimatePresence>
          {autoReconnect && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2 overflow-hidden"
            >
              <label className="text-sm font-semibold text-[var(--rocket-gray-100)]">
                Intervalo de Reconexão (segundos)
              </label>
              <Input
                type="number"
                value={reconnectInterval}
                onChange={(e) => setReconnectInterval(Number(e.target.value))}
                min={1}
                max={60}
                className="bg-[var(--rocket-gray-800)] border-[var(--rocket-gray-600)] focus:border-[var(--rocket-purple)] focus:ring-2 focus:ring-[var(--rocket-purple)]/20 transition-all"
              />
              <p className="text-xs text-[var(--rocket-gray-400)]">
                Tempo de espera entre tentativas de reconexão
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Max Reconnect Attempts */}
        <AnimatePresence>
          {autoReconnect && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="space-y-2 overflow-hidden"
            >
              <label className="text-sm font-semibold text-[var(--rocket-gray-100)]">
                Máximo de Tentativas
              </label>
              <Input
                type="number"
                value={maxReconnectAttempts}
                onChange={(e) => setMaxReconnectAttempts(Number(e.target.value))}
                min={1}
                max={100}
                className="bg-[var(--rocket-gray-800)] border-[var(--rocket-gray-600)] focus:border-[var(--rocket-purple)] focus:ring-2 focus:ring-[var(--rocket-purple)]/20 transition-all"
              />
              <p className="text-xs text-[var(--rocket-gray-400)]">
                Número máximo de tentativas de reconexão antes de parar
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end gap-3 pt-6 border-t border-[var(--rocket-gray-600)]"
        >
          <Button
            variant="ghost"
            onClick={() => {
              setAutoReconnect(true);
              setReconnectInterval(5);
              setMaxReconnectAttempts(10);
            }}
            className="hover:bg-[var(--rocket-gray-700)]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Restaurar padrões
          </Button>
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
            className="bg-[var(--rocket-purple)] hover:bg-[var(--rocket-purple)]/90 shadow-lg shadow-[var(--rocket-purple)]/20"
          >
            {isSaving ? "Salvando..." : "Salvar configurações"}
          </Button>
        </motion.div>
      </CardContent>
    </Card>
    </motion.div>
  );
}

