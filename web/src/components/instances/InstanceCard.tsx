"use client";

import {
  Badge,
  Button,
  Card,
  LottieIcon,
  Modal,
  ModalFooter,
} from "@/components/ui";
import FancyButton from "@/components/ui/FancyButton";
import {
  useConnectInstance,
  useDeleteInstance,
  useLogoutInstance,
  useRestartInstance,
} from "@/hooks/useInstances";
import { cn, formatDate, formatPhone } from "@/lib/utils";
import type { Instance } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Copy,
  LogOut,
  MoreVertical,
  QrCode,
  RefreshCw,
  Settings,
  Smartphone,
  Trash2,
  Wifi,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import settingsAnimation from "../../../public/definicoes.json";
import disconnectAnimation from "../../../public/desconectar.json";
import deleteAnimation from "../../../public/excluir.json";
import restartAnimation from "../../../public/girar.json";
import { QRCodeDisplay } from "./QRCodeDisplay";

interface InstanceCardProps {
  instance: Instance;
  onRefresh?: () => void;
}

export function InstanceCard({ instance, onRefresh }: InstanceCardProps) {
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const connectMutation = useConnectInstance();
  const restartMutation = useRestartInstance();
  const logoutMutation = useLogoutInstance();
  const deleteMutation = useDeleteInstance();

  const isConnected = instance.status === "connected";
  const isLoading =
    connectMutation.isPending ||
    restartMutation.isPending ||
    logoutMutation.isPending ||
    deleteMutation.isPending;

  const handleConnect = async () => {
    setShowQRModal(true);
    try {
      await connectMutation.mutateAsync(instance.name);
    } catch (error) {
      console.error("Failed to connect instance", error);
    }
  };

  const handleRestart = async () => {
    await restartMutation.mutateAsync(instance.name);
    setShowMenu(false);
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync(instance.name);
    setShowMenu(false);
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(instance.name);
    setShowDeleteModal(false);
  };

  const handleCopyName = () => {
    navigator.clipboard.writeText(instance.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    switch (instance.status) {
      case "connected":
        return (
          <Badge variant="success" pulse>
            Conectado
          </Badge>
        );
      case "disconnected":
        return <Badge variant="danger">Desconectado</Badge>;
      case "connecting":
        return (
          <Badge variant="warning" pulse>
            Conectando
          </Badge>
        );
      case "qr_code":
        return <Badge variant="info">Aguardando QR</Badge>;
      default:
        return <Badge>Desconhecido</Badge>;
    }
  };

  const menuItems = [
    {
      key: "settings",
      label: "Configurações",
      icon: settingsAnimation,
      tone: "default" as const,
      hint: "Preferências e webhooks",
      action: () => {
        setShowMenu(false);
        router.push(`/instances/${instance.name}/settings`);
      },
    },
    {
      key: "restart",
      label: "Reiniciar",
      icon: restartAnimation,
      tone: "primary" as const,
      hint: "Reinicia a sessão",
      disabled: isLoading,
      action: handleRestart,
    },
    ...(isConnected
      ? [
          {
            key: "disconnect",
            label: "Desconectar",
            icon: disconnectAnimation,
            tone: "primary" as const,
            hint: "Finaliza a sessão atual",
            disabled: isLoading,
            action: handleLogout,
          },
        ]
      : []),
    {
      key: "delete",
      label: "Excluir",
      icon: deleteAnimation,
      tone: "danger" as const,
      hint: "Remove a instância",
      action: () => {
        setShowMenu(false);
        setShowDeleteModal(true);
      },
    },
  ];

  return (
    <>
      <Card className="relative overflow-visible group bg-[var(--rocket-gray-900)]/60 border border-white/12 backdrop-blur-xl backdrop-saturate-150 shadow-[0_25px_80px_rgba(0,0,0,0.38)] ring-1 ring-[var(--rocket-purple)]/14">
        {/* Status indicator line */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-1 transition-all duration-300",
            isConnected
              ? "bg-[var(--rocket-green)]"
              : "bg-[var(--rocket-gray-600)]"
          )}
        />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                "bg-gradient-to-br from-[var(--rocket-purple)]/20 to-[var(--rocket-purple)]/5",
                "border border-[var(--rocket-purple)]/30"
              )}
            >
              {instance.profilePicture ? (
                <Image
                  src={instance.profilePicture}
                  alt={instance.profileName || instance.name}
                  className="w-full h-full rounded-xl object-cover"
                  width={48}
                  height={48}
                />
              ) : (
                <Smartphone className="w-6 h-6 text-[var(--rocket-purple)]" />
              )}
            </div>

            {/* Info */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[var(--rocket-gray-50)]">
                  {instance.name}
                </h3>
                <button
                  onClick={handleCopyName}
                  className="p-1 rounded hover:bg-[var(--rocket-gray-700)] transition-colors"
                  title="Copiar nome da instância"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-[var(--rocket-green)]" />
                  ) : (
                    <Copy className="w-3 h-3 text-[var(--rocket-gray-400)]" />
                  )}
                </button>
              </div>

              {instance.profileName &&
                instance.profileName !== instance.name && (
                  <p className="text-sm font-medium text-[var(--rocket-gray-300)]">
                    {instance.profileName}
                  </p>
                )}

              {instance.phone && (
                <p className="text-xs text-[var(--rocket-gray-400)] mt-0.5">
                  {formatPhone(instance.phone)}
                </p>
              )}
            </div>
          </div>

          {/* Menu button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 shadow-[0_6px_18px_rgba(0,0,0,0.25)] transition-all"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2 z-30 w-56 overflow-hidden rounded-2xl border border-white/14 bg-[var(--rocket-gray-900)]/85 backdrop-blur-xl backdrop-saturate-150 shadow-[0_24px_60px_rgba(0,0,0,0.5)] ring-1 ring-[var(--rocket-purple)]/18"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--rocket-purple)]/18 via-transparent to-[var(--rocket-blue,#38bdf8)]/14 pointer-events-none" />
                    <div className="relative p-2 space-y-1">
                      {menuItems.map((item, index) => (
                        <div key={item.key} className="space-y-1">
                          {index === 2 && isConnected && (
                            <div className="h-px my-1 bg-white/10" />
                          )}
                          <button
                            onClick={item.action}
                            disabled={item.disabled}
                            className={cn(
                              "w-full px-3 py-2.5 text-left text-sm flex items-center gap-3 rounded-xl transition-all",
                              "hover:bg-white/12 active:scale-[0.99]",
                              item.tone === "danger"
                                ? "text-[var(--rocket-danger)]"
                                : item.tone === "primary"
                                ? "text-[var(--rocket-purple-light)]"
                                : "text-[var(--rocket-purple-light)]",
                              item.disabled
                                ? "opacity-80 cursor-not-allowed"
                                : ""
                            )}
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--rocket-purple)]/16 border border-[var(--rocket-purple)]/28 shadow-[0_12px_36px_rgba(130,87,229,0.28)]">
                              <LottieIcon
                                animationData={item.icon}
                                className="w-7 h-7"
                                loop
                              />
                            </span>
                            <div className="flex-1 text-left">
                              <div className="font-semibold">{item.label}</div>
                              <div className="text-[11px] text-[var(--rocket-gray-400)]">
                                {item.hint}
                              </div>
                            </div>
                            {item.key === "restart" && (
                              <RefreshCw className="w-4 h-4 opacity-80 text-[var(--rocket-purple-light)]" />
                            )}
                            {item.key === "settings" && (
                              <Settings className="w-4 h-4 opacity-80 text-[var(--rocket-purple-light)]" />
                            )}
                            {item.key === "disconnect" && (
                              <LogOut className="w-4 h-4 opacity-80 text-[var(--rocket-purple-light)]" />
                            )}
                            {item.tone === "danger" && (
                              <Trash2 className="w-4 h-4 opacity-70" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Status badge */}
        <div className="mt-4 flex items-center gap-2">{getStatusBadge()}</div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-[var(--rocket-gray-600)] flex items-center justify-between">
          <span className="text-xs text-[var(--rocket-gray-400)]">
            Criado em {formatDate(instance.createdAt)}
          </span>

          {!isConnected && (
            <FancyButton onClick={handleConnect}>
              <QrCode className="icon w-4 h-4 mr-2" />
              {connectMutation.isPending ? "Conectando..." : "Conectar"}
            </FancyButton>
          )}

          {isConnected && (
            <div className="flex items-center gap-1 text-[var(--rocket-green)]">
              <Wifi className="w-4 h-4" />
              <span className="text-xs font-medium">Online</span>
            </div>
          )}
        </div>
      </Card>

      {/* QR Code Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title={`Conectar ${instance.name}`}
        description="Escaneie o QR Code com o WhatsApp do seu celular"
        size="md"
      >
        <QRCodeDisplay
          instanceName={instance.name}
          onConnected={() => {
            setShowQRModal(false);
            onRefresh?.();
          }}
        />
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Excluir instância"
        size="sm"
      >
        <p className="text-[var(--rocket-gray-300)]">
          Tem certeza que deseja excluir a instância{" "}
          <span className="font-semibold text-[var(--rocket-gray-50)]">
            {instance.name}
          </span>
          ?
        </p>
        <p className="text-sm text-[var(--rocket-gray-400)] mt-2">
          Esta ação não pode ser desfeita.
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={deleteMutation.isPending}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Excluir
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

export default InstanceCard;
