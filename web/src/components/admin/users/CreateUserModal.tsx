"use client";

import { Button, Input, Modal } from "@/components/ui";
import type { CreateUserInput } from "@/hooks/useAdminUsers";
import { motion } from "framer-motion";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useState } from "react";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserInput) => Promise<void>;
  isLoading?: boolean;
}

export function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: CreateUserModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<CreateUserInput>({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
    } else if (formData.password.length < 8) {
      newErrors.password = "Senha deve ter no mínimo 8 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await onSubmit(formData);
      setFormData({ name: "", email: "", password: "", role: "USER" });
      setErrors({});
      onClose();
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Erro ao criar usuário",
      });
    }
  };

  const handleClose = () => {
    setFormData({ name: "", email: "", password: "", role: "USER" });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Criar Novo Usuário"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-[var(--rocket-gray-300)] mb-1">
            Senha <span className="text-[var(--rocket-danger)]">*</span>
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Mínimo 8 caracteres"
              error={errors.password}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--rocket-gray-400)] hover:text-[var(--rocket-gray-200)]"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-[var(--rocket-gray-300)] mb-1">
            Role
          </label>
          <select
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value })
            }
            className="w-full h-10 px-3 rounded-lg bg-[#0f0f14] border border-[#29292e] text-[var(--rocket-gray-100)] focus:outline-none focus:border-[var(--rocket-purple)]"
          >
            <option value="USER">Usuário</option>
            <option value="DEVELOPER">Desenvolvedor</option>
            <option value="ADMIN">Administrador</option>
          </select>
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
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            {isLoading ? "Criando..." : "Criar Usuário"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

