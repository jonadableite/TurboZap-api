"use client";

import { Button, Input, Modal } from "@/components/ui";
import type { AdminUser } from "@/hooks/useAdminUsers";
import { motion } from "framer-motion";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onSubmit: (userId: string, data: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
}

export function EditUserModal({
  isOpen,
  onClose,
  user,
  onSubmit,
  isLoading,
}: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !user) return;

    try {
      await onSubmit(user.id, formData);
      setErrors({});
      onClose();
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar usuário",
      });
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Usuário"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-[var(--rocket-gray-300)] mb-1">
            Nome <span className="text-[var(--rocket-danger)]">*</span>
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="Nome completo"
            error={errors.name}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-[var(--rocket-gray-300)] mb-1">
            Email <span className="text-[var(--rocket-danger)]">*</span>
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="email@exemplo.com"
            error={errors.email}
          />
        </div>

        {/* Error Message */}
        {errors.submit && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-[var(--rocket-danger)]/10 border border-[var(--rocket-danger)]/30 text-[var(--rocket-danger)] text-sm"
          >
            {errors.submit}
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#29292e]">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isLoading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

