"use client";

import { Badge, Button, Modal, Spinner } from "@/components/ui";
import type { AdminUser, UserSession } from "@/hooks/useAdminUsers";
import { motion } from "framer-motion";
import { ExitAnimatedIcon } from "@/components/icons/ExitAnimatedIcon";
import { TrashAnimatedIcon } from "@/components/icons/TrashAnimatedIcon";
import {
  Clock,
  Globe,
  Monitor,
  MoreVertical,
  Smartphone,
  UserCog,
} from "lucide-react";
import { useState } from "react";

interface UserSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser | null;
  sessions: UserSession[];
  isLoading?: boolean;
  onRevokeSession: (sessionToken: string) => Promise<void>;
  onRevokeAllSessions: (userId: string) => Promise<void>;
  isRevoking?: boolean;
}

export function UserSessionsModal({
  isOpen,
  onClose,
  user,
  sessions,
  isLoading,
  onRevokeSession,
  onRevokeAllSessions,
  isRevoking,
}: UserSessionsModalProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDeviceIcon = (userAgent?: string | null) => {
    if (!userAgent) return <Monitor className="w-4 h-4" />;

    const ua = userAgent.toLowerCase();
    if (
      ua.includes("mobile") ||
      ua.includes("android") ||
      ua.includes("iphone")
    ) {
      return <Smartphone className="w-4 h-4" />;
    }
    return <Monitor className="w-4 h-4" />;
  };

  const getDeviceName = (userAgent?: string | null) => {
    if (!userAgent) return "Dispositivo desconhecido";

    const ua = userAgent.toLowerCase();

    // Browser detection
    let browser = "Navegador";
    if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
    else if (ua.includes("firefox")) browser = "Firefox";
    else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
    else if (ua.includes("edg")) browser = "Edge";
    else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera";

    // OS detection
    let os = "";
    if (ua.includes("windows")) os = "Windows";
    else if (ua.includes("mac")) os = "macOS";
    else if (ua.includes("linux")) os = "Linux";
    else if (ua.includes("android")) os = "Android";
    else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

    return `${browser}${os ? ` em ${os}` : ""}`;
  };

  const isExpired = (expiresAt: Date | string) => {
    return new Date(expiresAt) < new Date();
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sessões do Usuário"
      size="lg"
    >
      <div className="space-y-4">
        {/* User Info */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#0f0f14] border border-[#29292e]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--rocket-purple)] to-[var(--rocket-info)] flex items-center justify-center text-white font-medium">
              {user.name?.charAt(0)?.toUpperCase() ||
                user.email?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-[var(--rocket-gray-100)]">
                {user.name}
              </p>
              <p className="text-sm text-[var(--rocket-gray-400)]">
                {user.email}
              </p>
            </div>
          </div>

          {sessions.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRevokeAllSessions(user.id)}
              disabled={isRevoking}
              leftIcon={<TrashAnimatedIcon className="w-4 h-4" />}
              className="text-[var(--rocket-danger)] hover:text-[var(--rocket-danger)]"
            >
              Revogar Todas
            </Button>
          )}
        </div>

        {/* Sessions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto mb-3 w-12 h-12 opacity-70">
              <ExitAnimatedIcon className="w-12 h-12" />
            </div>
            <p className="text-[var(--rocket-gray-400)]">
              Nenhuma sessão ativa
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-[#0f0f14] border border-[#29292e] hover:border-[var(--rocket-gray-400)]/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#29292e] flex items-center justify-center text-[var(--rocket-gray-400)]">
                      {getDeviceIcon(session.userAgent)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[var(--rocket-gray-100)]">
                          {getDeviceName(session.userAgent)}
                        </p>
                        {session.impersonatedBy && (
                          <Badge variant="info" className="gap-1">
                            <UserCog className="w-3 h-3" />
                            Impersonada
                          </Badge>
                        )}
                        {isExpired(session.expiresAt) && (
                          <Badge variant="danger">Expirada</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-1 text-sm text-[var(--rocket-gray-400)]">
                        {session.ipAddress && (
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {session.ipAddress}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Criada em {formatDate(session.createdAt)}
                        </div>
                      </div>

                      <p className="text-xs text-[var(--rocket-gray-500)] mt-1">
                        Expira em {formatDate(session.expiresAt)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === session.id ? null : session.id
                        )
                      }
                      className="h-8 w-8 p-0"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>

                    {openMenuId === session.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute right-0 mt-1 w-40 rounded-lg bg-[#1a1a24] border border-[#29292e] shadow-xl z-20 py-1"
                        >
                          <button
                            onClick={() => {
                              onRevokeSession(session.token);
                              setOpenMenuId(null);
                            }}
                            disabled={isRevoking}
                            className="w-full px-3 py-2 text-left text-sm text-[var(--rocket-danger)] hover:bg-[#29292e] flex items-center gap-2 disabled:opacity-50"
                          >
                            <ExitAnimatedIcon className="w-4 h-4" />
                            Revogar Sessão
                          </button>
                        </motion.div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-[#29292e]">
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

