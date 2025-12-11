"use client";

import { Button, Input, Modal } from "@/components/ui";
import type { AdminUser, BanUserInput } from "@/hooks/useAdminUsers";
import { motion } from "framer-motion";
import { AlertTriangle, Ban } from "lucide-react";
import { useEffect, useState } from "react";

interface BanUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onSubmit: (data: BanUserInput) => Promise<void>;
  isLoading?: boolean;
}

const DURATION_OPTIONS = [
  { label: "1 hora", value: 60 * 60 },
  { label: "24 horas", value: 60 * 60 * 24 },
  { label: "7 dias", value: 60 * 60 * 24 * 7 },
  { label: "30 dias", value: 60 * 60 * 24 * 30 },
  { label: "Permanente", value: 0 },
];

export function BanUserModal({
  isOpen,
  onClose,
  user,
  onSubmit,
  isLoading,
}: BanUserModalProps) {
  const [formData, setFormData] = useState({
    banReason: "",
    banExpiresIn: 0,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFormData({ banReason: "", banExpiresIn: 0 });
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      await onSubmit({
        userId: user.id,
        banReason: formData.banReason || undefined,
        banExpiresIn: formData.banExpiresIn || undefined,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao banir usuário"
      );
    }
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Banir Usuário"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warning */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--rocket-warning)]/10 border border-[var(--rocket-warning)]/30">
          <AlertTriangle className="w-5 h-5 text-[var(--rocket-warning)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-[var(--rocket-warning)]">
              Atenção
            </p>
            <p className="text-sm text-[var(--rocket-gray-300)] mt-1">
              Ao banir este usuário, ele não poderá fazer login e todas as
              suas sessões ativas serão revogadas.
            </p>
          </div>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0f0f14] border border-[#29292e]">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--rocket-purple)] to-[var(--rocket-info)] flex items-center justify-center text-white font-medium">
            {user.name?.charAt(0)?.toUpperCase() ||
              user.email?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-[var(--rocket-gray-100)]">
              {user.name}
            </p>
            <p className="text-sm text-[var(--rocket-gray-400)]">{user.email}</p>
          </div>
        </div>

        {/* Ban Reason */}
        <div>
          <label className="block text-sm font-medium text-[var(--rocket-gray-300)] mb-1">
            Motivo do banimento
          </label>
          <Input
            type="text"
            value={formData.banReason}
            onChange={(e) =>
              setFormData({ ...formData, banReason: e.target.value })
            }
            placeholder="Ex: Violação dos termos de uso"
          />
          <p className="text-xs text-[var(--rocket-gray-400)] mt-1">
            Opcional. O usuário verá este motivo ao tentar fazer login.
          </p>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-[var(--rocket-gray-300)] mb-1">
            Duração do banimento
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, banExpiresIn: option.value })
                }
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  formData.banExpiresIn === option.value
                    ? "bg-[var(--rocket-warning)]/20 border-[var(--rocket-warning)] text-[var(--rocket-warning)]"
                    : "bg-[#0f0f14] border-[#29292e] text-[var(--rocket-gray-300)] hover:border-[var(--rocket-gray-400)]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-[var(--rocket-danger)]/10 border border-[var(--rocket-danger)]/30 text-[var(--rocket-danger)] text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#29292e]">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={isLoading}
            leftIcon={<Ban className="w-4 h-4" />}
          >
            {isLoading ? "Banindo..." : "Banir Usuário"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

