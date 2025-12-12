"use client";

import { Button, Modal } from "@/components/ui";
import type { AdminUser } from "@/hooks/useAdminUsers";
import { motion } from "framer-motion";
import { ShieldAnimatedIcon } from "@/components/icons/ShieldAnimatedIcon";
import { Shield, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onSubmit: (userId: string, role: string) => Promise<void>;
  isLoading?: boolean;
}

const ROLES = [
  {
    id: "USER",
    label: "Usuário",
    description: "Acesso básico à plataforma",
    icon: <Shield className="w-5 h-5" />,
    color: "var(--rocket-gray-400)",
  },
  {
    id: "DEVELOPER",
    label: "Desenvolvedor",
    description: "Acesso estendido com visualização de logs",
    icon: <ShieldCheck className="w-5 h-5" />,
    color: "var(--rocket-info)",
  },
  {
    id: "ADMIN",
    label: "Administrador",
    description: "Acesso total com gerenciamento de usuários",
    icon: <ShieldAnimatedIcon className="w-5 h-5" />,
    color: "var(--rocket-purple)",
  },
];

export function ChangeRoleModal({
  isOpen,
  onClose,
  user,
  onSubmit,
  isLoading,
}: ChangeRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role || "USER");
      setError("");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !selectedRole) return;

    try {
      await onSubmit(user.id, selectedRole);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao alterar role"
      );
    }
  };

  if (!user) return null;

  const hasChanged = selectedRole !== (user.role || "USER");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Alterar Role"
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

        {/* Role Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--rocket-gray-300)]">
            Selecione o novo role
          </label>
          <div className="space-y-2">
            {ROLES.map((role) => {
              const isSelected = selectedRole === role.id;
              const isCurrent = user.role === role.id;

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    isSelected
                      ? "bg-[var(--rocket-purple)]/10 border-[var(--rocket-purple)]"
                      : "bg-[#0f0f14] border-[#29292e] hover:border-[var(--rocket-gray-400)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${role.color}20` }}
                    >
                      <div style={{ color: role.color }}>{role.icon}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[var(--rocket-gray-100)]">
                          {role.label}
                        </p>
                        {isCurrent && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--rocket-gray-400)]/20 text-[var(--rocket-gray-400)]">
                            Atual
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--rocket-gray-400)] mt-1">
                        {role.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[var(--rocket-purple)] flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
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
            disabled={isLoading || !hasChanged}
            leftIcon={<ShieldAnimatedIcon className="w-4 h-4" />}
          >
            {isLoading ? "Alterando..." : "Alterar Role"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

