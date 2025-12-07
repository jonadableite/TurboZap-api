"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Badge } from "@/components/ui";
import { Save, Webhook, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { type WebhookConfig } from "@/lib/webhook-api";
import { useWebhook, useSetWebhook, useWebhookEvents } from "@/hooks/useWebhook";
import { useToast } from "@/components/ui";

interface WebhookSettingsProps {
  instanceName: string;
}

export function WebhookSettings({ instanceName }: WebhookSettingsProps) {
  const [url, setUrl] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [webhookByEvents, setWebhookByEvents] = useState(false);
  const [webhookBase64, setWebhookBase64] = useState(false);
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);

  // Load webhook config
  const { data: webhookConfig, isLoading } = useWebhook(instanceName);
  const { data: events } = useWebhookEvents();

  // Load available events
  useEffect(() => {
    if (events) {
      setAvailableEvents(events);
    }
  }, [events]);

  // Update form when config loads
  useEffect(() => {
    if (webhookConfig) {
      setUrl(webhookConfig.url || "");
      setEnabled(webhookConfig.enabled ?? true);
      setWebhookByEvents(webhookConfig.webhook_by_events ?? false);
      setWebhookBase64(webhookConfig.webhook_base64 ?? false);
      setSelectedEvents(webhookConfig.events || []);
      if (webhookConfig.headers) {
        setHeaders(
          Object.entries(webhookConfig.headers).map(([key, value]) => ({
            key,
            value,
          }))
        );
      }
    }
  }, [webhookConfig]);

  const saveMutation = useSetWebhook(instanceName);
  const { showToast } = useToast();

  const handleSave = async () => {
    try {
      const headersObj = headers.reduce(
        (acc, h) => {
          if (h.key && h.value) acc[h.key] = h.value;
          return acc;
        },
        {} as Record<string, string>
      );

      await saveMutation.mutateAsync({
        url,
        enabled,
        events: selectedEvents,
        headers: headersObj,
        webhook_by_events: webhookByEvents,
        webhook_base64: webhookBase64,
      });

      showToast("Configurações de webhook salvas com sucesso!", "success");
    } catch (error) {
      showToast("Erro ao salvar configurações de webhook", "error");
    }
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: "key" | "value", value: string) => {
    setHeaders(
      headers.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    );
  };

  if (isLoading) {
    return (
      <Card className="border-[var(--rocket-gray-600)] bg-[var(--rocket-gray-800)]/50">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--rocket-purple)] border-t-transparent" />
            <p className="text-sm text-[var(--rocket-gray-400)]">
              Carregando configurações...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
              <Webhook className="w-5 h-5 text-[var(--rocket-purple)]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--rocket-gray-100)]">Webhook</h2>
              <CardDescription className="mt-1">
                Configure webhooks para receber eventos em tempo real
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-6">
        {/* URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--rocket-gray-100)]">
            URL do Webhook
          </label>
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://seu-servidor.com/webhook"
            className="bg-[var(--rocket-gray-800)] border-[var(--rocket-gray-600)]"
          />
          <p className="text-xs text-[var(--rocket-gray-400)]">
            URL que receberá os eventos do webhook
          </p>
        </div>

        {/* Enabled Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between p-4 rounded-lg bg-[var(--rocket-gray-800)] border border-[var(--rocket-gray-600)] hover:border-[var(--rocket-purple)]/30 transition-colors"
        >
          <div>
            <label className="text-sm font-semibold text-[var(--rocket-gray-100)]">
              Habilitar Webhook
            </label>
            <p className="text-xs text-[var(--rocket-gray-400)] mt-1">
              Ativa ou desativa o envio de eventos
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
        </motion.div>

        {/* Options */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={webhookByEvents}
              onChange={(e) => setWebhookByEvents(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--rocket-gray-600)] bg-[var(--rocket-gray-800)] text-[var(--rocket-purple)]"
            />
            <label className="text-sm text-[var(--rocket-gray-300)]">
              Webhook por eventos (adiciona slug do evento na URL)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={webhookBase64}
              onChange={(e) => setWebhookBase64(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--rocket-gray-600)] bg-[var(--rocket-gray-800)] text-[var(--rocket-purple)]"
            />
            <label className="text-sm text-[var(--rocket-gray-300)]">
              Codificar payload em Base64
            </label>
          </div>
        </div>

        {/* Headers */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[var(--rocket-gray-100)]">
              Headers Personalizados
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={addHeader}
              leftIcon={<Plus className="w-4 h-4" />}
              className="hover:bg-[var(--rocket-gray-700)]"
            >
              Adicionar
            </Button>
          </div>
          <AnimatePresence>
            {headers.map((header, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="flex gap-2"
              >
                <Input
                  type="text"
                  value={header.key}
                  onChange={(e) => updateHeader(index, "key", e.target.value)}
                  placeholder="Nome do header"
                  className="bg-[var(--rocket-gray-800)] border-[var(--rocket-gray-600)] focus:border-[var(--rocket-purple)] focus:ring-2 focus:ring-[var(--rocket-purple)]/20"
                />
                <Input
                  type="text"
                  value={header.value}
                  onChange={(e) => updateHeader(index, "value", e.target.value)}
                  placeholder="Valor"
                  className="bg-[var(--rocket-gray-800)] border-[var(--rocket-gray-600)] focus:border-[var(--rocket-purple)] focus:ring-2 focus:ring-[var(--rocket-purple)]/20"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeHeader(index)}
                  className="text-[var(--rocket-danger)] hover:bg-[var(--rocket-danger)]/10 hover:text-[var(--rocket-danger)]"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Events */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[var(--rocket-gray-100)]">
              Eventos
            </label>
            <Badge variant="info" className="text-xs">
              {selectedEvents.length} selecionado{selectedEvents.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-3 rounded-lg bg-[var(--rocket-gray-800)] border border-[var(--rocket-gray-600)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[var(--rocket-gray-800)] [&::-webkit-scrollbar-thumb]:bg-[var(--rocket-gray-600)] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[var(--rocket-gray-500)]">
            {availableEvents.map((event, index) => {
              const isSelected = selectedEvents.includes(event);
              return (
                <motion.button
                  key={event}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => toggleEvent(event)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 p-2.5 rounded-lg text-sm transition-all duration-200 border ${
                    isSelected
                      ? "bg-[var(--rocket-purple)]/20 text-[var(--rocket-purple-light)] border-[var(--rocket-purple)]/30 shadow-md shadow-[var(--rocket-purple)]/10"
                      : "text-[var(--rocket-gray-300)] hover:bg-[var(--rocket-gray-700)] border-transparent hover:border-[var(--rocket-gray-500)]"
                  }`}
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleEvent(event)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-[var(--rocket-purple)] border-[var(--rocket-purple)]"
                          : "border-[var(--rocket-gray-500)] bg-transparent"
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <span className="font-medium">{event}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end gap-3 pt-6 border-t border-[var(--rocket-gray-600)]"
        >
          <Button
            onClick={handleSave}
            isLoading={saveMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
            className="bg-[var(--rocket-purple)] hover:bg-[var(--rocket-purple)]/90 shadow-lg shadow-[var(--rocket-purple)]/20"
          >
            {saveMutation.isPending ? "Salvando..." : "Salvar configurações"}
          </Button>
        </motion.div>
      </CardContent>
    </Card>
    </motion.div>
  );
}

