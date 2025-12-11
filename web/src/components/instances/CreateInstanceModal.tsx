"use client";

import { Button, Input, Modal, ModalFooter } from "@/components/ui";
import { useCreateInstance } from "@/hooks/useInstances";
import { motion } from "framer-motion";
import { AlertCircle, Plus, Smartphone } from "lucide-react";
import { useState } from "react";
import { QRCodeDisplay } from "./QRCodeDisplay";

interface CreateInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = "form" | "qrcode" | "success";

export function CreateInstanceModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateInstanceModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [createdInstanceName, setCreatedInstanceName] = useState("");

  const createMutation = useCreateInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!name.trim()) {
      setError("Nome da instância é obrigatório");
      return;
    }

    if (name.length < 3) {
      setError("Nome deve ter pelo menos 3 caracteres");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      setError("Nome deve conter apenas letras, números, _ ou -");
      return;
    }

    try {
      await createMutation.mutateAsync({ name: name.trim() });
      setCreatedInstanceName(name.trim());
      setStep("qrcode");
    } catch (err: unknown) {
      const maybeMessage =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { error?: { message?: string } } } })
          .response?.data?.error?.message;
      const message =
        typeof maybeMessage === "string" ? maybeMessage : undefined;
      setError(message ?? "Erro ao criar instância");
    }
  };

  const handleClose = () => {
    setStep("form");
    setName("");
    setError("");
    setCreatedInstanceName("");
    onClose();
  };

  const handleConnected = () => {
    setStep("success");
    onSuccess?.();
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        step === "form"
          ? "Nova Instância"
          : step === "qrcode"
          ? "Conectar WhatsApp"
          : ""
      }
      description={
        step === "form"
          ? "Crie uma nova instância para conectar ao WhatsApp"
          : step === "qrcode"
          ? `Escaneie o QR Code para conectar ${createdInstanceName}`
          : ""
      }
      size="md"
    >
      {step === "form" && (
        <form onSubmit={handleSubmit}>
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--rocket-purple)] to-[var(--rocket-purple-dark)] flex items-center justify-center"
            >
              <Smartphone className="w-8 h-8 text-white" />
            </motion.div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <Input
              label="Nome da instância"
              placeholder="ex: minha-empresa"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              error={error}
              helperText="Use apenas letras, números, _ ou -"
              leftIcon={<Smartphone className="w-4 h-4" />}
              autoFocus
            />

            {/* Tips */}
            <div className="p-3 bg-[var(--rocket-gray-900)] rounded-lg border border-[var(--rocket-gray-600)]">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-[var(--rocket-info)] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-[var(--rocket-gray-300)]">
                  <p className="font-medium text-[var(--rocket-gray-100)] mb-1">
                    Dicas:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[var(--rocket-gray-400)]">
                    <li>
                      Use nomes descritivos como &quot;vendas&quot; ou
                      &quot;suporte&quot;
                    </li>
                    <li>Cada instância conecta a um número de WhatsApp</li>
                    <li>Você poderá conectar após criar a instância</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <ModalFooter>
            <Button variant="ghost" onClick={handleClose} type="button">
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Criar instância
            </Button>
          </ModalFooter>
        </form>
      )}

      {step === "qrcode" && createdInstanceName && (
        <QRCodeDisplay
          instanceName={createdInstanceName}
          onConnected={handleConnected}
        />
      )}

      {step === "success" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-20 h-20 rounded-full bg-[var(--rocket-green)]/20 flex items-center justify-center mb-4"
          >
            <svg
              className="w-10 h-10 text-[var(--rocket-green)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>
          <h3 className="text-xl font-semibold text-[var(--rocket-gray-50)] mb-2">
            Instância criada!
          </h3>
          <p className="text-[var(--rocket-gray-400)]">Redirecionando...</p>
        </motion.div>
      )}
    </Modal>
  );
}

export default CreateInstanceModal;
