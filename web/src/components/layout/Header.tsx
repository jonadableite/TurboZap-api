"use client";

import { Button, Input, Modal, ModalFooter } from "@/components/ui";
import { useApiConfig } from "@/hooks/useApiConfig";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Bell, Check, Copy, Eye, EyeOff, Key, Settings } from "lucide-react";
import { useEffect, useState } from "react";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const { apiKey, hasApiKey, updateConfig } = useApiConfig();

  useEffect(() => {
    setApiKeyInput(apiKey || "");
  }, [apiKey]);

  const handleSaveApiKey = () => {
    updateConfig(apiKeyInput.trim() || undefined);
    setShowApiKeyModal(false);
  };

  const handleCopyKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <header className="h-16 bg-[var(--rocket-gray-800)]/60 backdrop-blur-xl border-b border-[var(--rocket-gray-600)] sticky top-0 z-20">
        <div className="h-full px-4 sm:px-8 lg:px-14">
          <div className="h-full flex items-center justify-between w-full max-w-6xl mx-auto">
            {/* Left side - Title */}
            <div>
              <h1 className="text-xl font-bold text-[var(--rocket-gray-50)]">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-[var(--rocket-gray-400)]">
                  {description}
                </p>
              )}
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              {/* API Key indicator */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setApiKeyInput(apiKey || "");
                  setShowApiKeyModal(true);
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                  hasApiKey
                    ? "bg-[var(--rocket-green)]/20 text-[var(--rocket-green)] hover:bg-[var(--rocket-green)]/30"
                    : "bg-[var(--rocket-warning)]/20 text-[var(--rocket-warning)] hover:bg-[var(--rocket-warning)]/30"
                )}
              >
                <Key className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {hasApiKey ? "API Key configurada" : "Configurar API Key"}
                </span>
              </motion.button>

              {/* Notifications */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-lg text-[var(--rocket-gray-400)] hover:text-[var(--rocket-gray-50)] hover:bg-[var(--rocket-gray-700)] transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--rocket-purple)]" />
              </motion.button>

              {/* Settings */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg text-[var(--rocket-gray-400)] hover:text-[var(--rocket-gray-50)] hover:bg-[var(--rocket-gray-700)] transition-colors"
              >
                <Settings className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* API Key Modal */}
      <Modal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        title="Configurar API Key"
        description="Insira sua chave de API para conectar ao TurboZap"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="API Key"
            type={showKey ? "text" : "password"}
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="Sua chave de API"
            leftIcon={<Key className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1 hover:bg-[var(--rocket-gray-700)] rounded"
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
          />

          {hasApiKey && apiKey && (
            <div className="p-3 bg-[var(--rocket-gray-900)] rounded-lg border border-[var(--rocket-gray-600)]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--rocket-gray-400)]">
                  Chave atual configurada
                </span>
                <button
                  onClick={handleCopyKey}
                  className="flex items-center gap-1 text-sm text-[var(--rocket-purple-light)] hover:text-[var(--rocket-purple)]"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="p-3 bg-[var(--rocket-info)]/10 rounded-lg border border-[var(--rocket-info)]/30">
            <p className="text-sm text-[var(--rocket-info)]">
              💡 Sua API Key está definida no arquivo .env do servidor como{" "}
              <code className="px-1 bg-[var(--rocket-gray-800)] rounded">
                API_KEY
              </code>
            </p>
          </div>
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowApiKeyModal(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveApiKey}
            leftIcon={<Check className="w-4 h-4" />}
          >
            Salvar
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

export default Header;
