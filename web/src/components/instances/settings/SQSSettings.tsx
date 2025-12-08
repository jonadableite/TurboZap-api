"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input } from "@/components/ui";
import { Save, Package } from "lucide-react";

interface SQSSettingsProps {
  instanceName: string;
}

export function SQSSettings({ instanceName: _instanceName }: SQSSettingsProps) {
  void _instanceName;
  const [isSaving, setIsSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [region, setRegion] = useState("us-east-1");
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [queueUrl, setQueueUrl] = useState("");

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
              <Package className="w-5 h-5 text-[var(--rocket-purple)]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--rocket-gray-100)]">Amazon SQS</h2>
              <CardDescription className="mt-1">
                Configure integração com Amazon SQS para filas de mensagens
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg border border-[var(--rocket-gray-600)] bg-[var(--rocket-gray-800)]/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-[var(--rocket-gray-100)]">
                  Habilitar SQS
                </label>
                <p className="text-xs text-[var(--rocket-gray-400)] mt-1">
                  Ativa a integração com Amazon SQS para processamento de filas
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
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--rocket-gray-100)]">
                  Região AWS
                </label>
                <Input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="us-east-1"
                  className="bg-[var(--rocket-gray-800)] border-[var(--rocket-gray-600)] focus:border-[var(--rocket-purple)] focus:ring-2 focus:ring-[var(--rocket-purple)]/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--rocket-gray-100)]">
                  Access Key ID
                </label>
                <Input
                  type="text"
                  value={accessKeyId}
                  onChange={(e) => setAccessKeyId(e.target.value)}
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  className="bg-[var(--rocket-gray-800)] border-[var(--rocket-gray-600)] focus:border-[var(--rocket-purple)] focus:ring-2 focus:ring-[var(--rocket-purple)]/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--rocket-gray-100)]">
                  Secret Access Key
                </label>
                <Input
                  type="password"
                  value={secretAccessKey}
                  onChange={(e) => setSecretAccessKey(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[var(--rocket-gray-800)] border-[var(--rocket-gray-600)] focus:border-[var(--rocket-purple)] focus:ring-2 focus:ring-[var(--rocket-purple)]/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--rocket-gray-100)]">
                  URL da Fila
                </label>
                <Input
                  type="url"
                  value={queueUrl}
                  onChange={(e) => setQueueUrl(e.target.value)}
                  placeholder="https://sqs.us-east-1.amazonaws.com/123456789012/my-queue"
                  className="bg-[var(--rocket-gray-800)] border-[var(--rocket-gray-600)] focus:border-[var(--rocket-purple)] focus:ring-2 focus:ring-[var(--rocket-purple)]/20 font-mono text-sm"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

