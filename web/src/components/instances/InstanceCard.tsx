'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Smartphone,
  QrCode,
  MoreVertical,
  RefreshCw,
  LogOut,
  Trash2,
  Wifi,
  WifiOff,
  Copy,
  Check,
  Settings,
} from 'lucide-react';
import { cn, getStatusLabel, formatPhone, formatDate } from '@/lib/utils';
import { Card, Badge, Button, Modal, ModalFooter } from '@/components/ui';
import FancyButton from '@/components/ui/FancyButton';
import { QRCodeDisplay } from './QRCodeDisplay';
import {
  useRestartInstance,
  useLogoutInstance,
  useDeleteInstance,
  useConnectInstance,
} from '@/hooks/useInstances';
import type { Instance } from '@/types';
import { useRouter } from 'next/navigation';

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

  const isConnected = instance.status === 'connected';
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
      console.error('Failed to connect instance', error);
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
      case 'connected':
        return <Badge variant="success" pulse>Conectado</Badge>;
      case 'disconnected':
        return <Badge variant="danger">Desconectado</Badge>;
      case 'connecting':
        return <Badge variant="warning" pulse>Conectando</Badge>;
      case 'qr_code':
        return <Badge variant="info">Aguardando QR</Badge>;
      default:
        return <Badge>Desconhecido</Badge>;
    }
  };

  return (
    <>
      <Card className="relative overflow-hidden group">
        {/* Status indicator line */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 h-1 transition-all duration-300',
            isConnected ? 'bg-[var(--rocket-green)]' : 'bg-[var(--rocket-gray-600)]'
          )}
        />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                'bg-gradient-to-br from-[var(--rocket-purple)]/20 to-[var(--rocket-purple)]/5',
                'border border-[var(--rocket-purple)]/30'
              )}
            >
              {instance.profilePicture ? (
                <img
                  src={instance.profilePicture}
                  alt={instance.profileName || instance.name}
                  className="w-full h-full rounded-xl object-cover"
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

              {instance.profileName && instance.profileName !== instance.name && (
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
              className="p-2"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>

            {/* Dropdown menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-1 z-20 w-48 py-1 bg-[var(--rocket-gray-700)] rounded-lg border border-[var(--rocket-gray-600)] shadow-xl"
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      router.push(`/instances/${instance.name}/settings`);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--rocket-gray-100)] hover:bg-[var(--rocket-gray-600)] flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Configurações
                  </button>
                  <div className="h-px bg-[var(--rocket-gray-600)] my-1" />
                  <button
                    onClick={handleRestart}
                    disabled={isLoading}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--rocket-gray-100)] hover:bg-[var(--rocket-gray-600)] flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reiniciar
                  </button>
                  {isConnected && (
                    <button
                      onClick={handleLogout}
                      disabled={isLoading}
                      className="w-full px-4 py-2 text-left text-sm text-[var(--rocket-warning)] hover:bg-[var(--rocket-gray-600)] flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Desconectar
                    </button>
                  )}
                  <div className="h-px bg-[var(--rocket-gray-600)] my-1" />
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteModal(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--rocket-danger)] hover:bg-[var(--rocket-gray-600)] flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className="mt-4 flex items-center gap-2">
          {getStatusBadge()}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-[var(--rocket-gray-600)] flex items-center justify-between">
          <span className="text-xs text-[var(--rocket-gray-400)]">
            Criado em {formatDate(instance.createdAt)}
          </span>

          {!isConnected && (
            <FancyButton onClick={handleConnect}>
              <QrCode className="icon w-4 h-4 mr-2" />
              {connectMutation.isPending ? 'Conectando...' : 'Conectar'}
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
          Tem certeza que deseja excluir a instância{' '}
          <span className="font-semibold text-[var(--rocket-gray-50)]">{instance.name}</span>?
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

