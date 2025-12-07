"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input } from "@/components/ui";
import { Save, Network } from "lucide-react";

interface ProxySettingsProps {
  instanceName: string;
}

export function ProxySettings({ instanceName }: ProxySettingsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implementar salvamento
    setTimeout(() => setIsSaving(false), 1000);
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
              <Network className="w-5 h-5 text-[var(--rocket-purple)]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--rocket-gray-100)]">Proxy</h2>
              <CardDescription className="mt-1">
                Configure um proxy para a conexão da instância
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
        {/* Enable Proxy */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg border border-[var(--rocket-gray-600)] bg-[var(--rocket-gray-800)]/30 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-semibold text-[var(--rocket-gray-100)]">
                Habilitar Proxy
              </label>
              <p className="text-xs text-[var(--rocket-gray-400)] mt-1">
                Use um servidor proxy para a conexão do WhatsApp
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-14 h-7 rounded-full transition-all duration-300 ${
                  enabled
                    ? "bg-[var(--rocket-purple)]"
                    : "bg-[var(--rocket-gray-600)]"
                }`}
              >
                <motion.div
                  className="w-6 h-6 bg-white rounded-full mt-0.5 ml-0.5 shadow-lg"
                  animate={{
                    x: enabled ? 28 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
            </label>
          </div>
        </motion.div>

        <AnimatePresence>
          {enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Host */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--rocket-gray-100)]">
                    Host do Proxy
                  </label>
                  <Input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="proxy.example.com"
                    className="bg-[var(--rocket-gray-800)] border-[var(--rocket-gray-600)] focus:border-[var(--rocket-purple)] focus:ring-2 focus:ring-[var(--rocket-purple)]/20"
                  />
                </div>

                {/* Port */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--rocket-gray-100)]">
                    Porta
                  </label>
                  <Input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="8080"
                    className="bg-[var(--rocket-gray-800)] border-[var(--rocket-gray-600)] focus:border-[var(--rocket-purple)] focus:ring-2 focus:ring-[var(--rocket-purple)]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--rocket-gray-100)]">
                    Usuário (opcional)
                  </label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="usuario"
                    className="bg-[var(--rocket-gray-800)] border-[var(--rocket-gray-600)] focus:border-[var(--rocket-purple)] focus:ring-2 focus:ring-[var(--rocket-purple)]/20"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--rocket-gray-100)]">
                    Senha (opcional)
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-[var(--rocket-gray-800)] border-[var(--rocket-gray-600)] focus:border-[var(--rocket-purple)] focus:ring-2 focus:ring-[var(--rocket-purple)]/20"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end pt-6 border-t border-[var(--rocket-gray-600)]"
        >
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

