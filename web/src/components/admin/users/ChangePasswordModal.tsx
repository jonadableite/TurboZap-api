"use client";

import { Button, Input, Modal } from "@/components/ui";
import type { AdminUser } from "@/hooks/useAdminUsers";
import { motion } from "framer-motion";
import { Eye, EyeOff, Key } from "lucide-react";
import { useEffect, useState } from "react";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onSubmit: (userId: string, newPassword: string) => Promise<void>;
  isLoading?: boolean;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  user,
  onSubmit,
  isLoading,
}: ChangePasswordModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({ password: "", confirmPassword: "" });
      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
    } else if (formData.password.length < 8) {
      newErrors.password = "Senha deve ter no mínimo 8 caracteres";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !user) return;

    try {
      await onSubmit(user.id, formData.password);
      onClose();
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error ? error.message : "Erro ao alterar senha",
      });
    }
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Alterar Senha"
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

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-[var(--rocket-gray-300)] mb-1">
            Nova Senha <span className="text-[var(--rocket-danger)]">*</span>
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

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-[var(--rocket-gray-300)] mb-1">
            Confirmar Senha{" "}
            <span className="text-[var(--rocket-danger)]">*</span>
          </label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              placeholder="Repita a senha"
              error={errors.confirmPassword}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--rocket-gray-400)] hover:text-[var(--rocket-gray-200)]"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
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
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            leftIcon={<Key className="w-4 h-4" />}
          >
            {isLoading ? "Alterando..." : "Alterar Senha"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

