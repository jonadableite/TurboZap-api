'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Smartphone, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Spinner } from '@/components/ui';
import { useInstanceQRCode, useInstanceStatus } from '@/hooks/useInstances';
import Image from 'next/image';

interface QRCodeDisplayProps {
  instanceName: string;
  onConnected?: () => void;
}

export function QRCodeDisplay({ instanceName, onConnected }: QRCodeDisplayProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const { data: qrCode, isLoading, isError, refetch } = useInstanceQRCode(instanceName);
  const { data: status } = useInstanceStatus(instanceName);
  const refetchRef = useRef(refetch);

  // Keep refetch ref updated
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  // Stable refetch function
  const handleRefetch = useCallback(() => {
    refetchRef.current();
  }, []);

  useEffect(() => {
    if (!qrCode) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          refetchRef.current();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [qrCode]);

  // Check for connection
  const onConnectedRef = useRef(onConnected);
  useEffect(() => {
    onConnectedRef.current = onConnected;
  }, [onConnected]);

  useEffect(() => {
    if (status?.status === 'connected' && onConnectedRef.current) {
      onConnectedRef.current();
    }
  }, [status?.status]);

  // Connected state
  if (status?.status === 'connected') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="w-20 h-20 rounded-full bg-[var(--rocket-green)]/20 flex items-center justify-center mb-4"
        >
          <CheckCircle2 className="w-10 h-10 text-[var(--rocket-green)]" />
        </motion.div>
        <h3 className="text-xl font-semibold text-[var(--rocket-gray-50)] mb-2">
          Conectado com sucesso!
        </h3>
        <p className="text-[var(--rocket-gray-400)] text-center">
          Sua instância <span className="text-[var(--rocket-purple-light)]">{instanceName}</span> está pronta para uso.
        </p>
      </motion.div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Spinner size="lg" />
        <p className="mt-4 text-[var(--rocket-gray-400)]">Gerando QR Code...</p>
      </div>
    );
  }

  // Error state
  if (isError || !qrCode) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 rounded-full bg-[var(--rocket-danger)]/20 flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8 text-[var(--rocket-danger)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--rocket-gray-50)] mb-2">
          Erro ao gerar QR Code
        </h3>
        <p className="text-[var(--rocket-gray-400)] text-center mb-4">
          Não foi possível gerar o QR Code. Tente novamente.
        </p>
        <Button onClick={handleRefetch} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center" key={qrCode}>
      {/* QR Code Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', bounce: 0.3 }}
        className="relative p-4 bg-white rounded-2xl mb-6"
      >
        {/* Animated border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--rocket-purple)] via-[var(--rocket-green)] to-[var(--rocket-purple)] p-[2px] animate-shimmer">
          <div className="w-full h-full bg-white rounded-2xl" />
        </div>

        {/* QR Code */}
        <div className="relative z-10 p-2">
          {qrCode.startsWith('data:image') ? (
            <Image
              src={qrCode}
              alt="QR Code"
              width={220}
              height={220}
              className="rounded"
            />
          ) : (
            // If it's a raw code string, use QRCodeSVG
            <QRCodeSVG
              value={qrCode}
              size={220}
              level="M"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#121214"
            />
          )}
        </div>

        {/* Timer overlay */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--rocket-gray-800)] rounded-full border border-[var(--rocket-gray-600)]">
          <span className={cn(
            'text-sm font-medium',
            timeLeft <= 10 ? 'text-[var(--rocket-danger)]' : 'text-[var(--rocket-gray-100)]'
          )}>
            {timeLeft}s
          </span>
        </div>
      </motion.div>

      {/* Instructions */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-[var(--rocket-gray-100)]">
          <Smartphone className="w-5 h-5 text-[var(--rocket-purple)]" />
          <span className="font-medium">Escaneie o QR Code</span>
        </div>
        
        <ol className="text-sm text-[var(--rocket-gray-400)] space-y-2">
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--rocket-purple)]/20 text-[var(--rocket-purple-light)] text-xs flex items-center justify-center">1</span>
            <span>Abra o WhatsApp no seu celular</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--rocket-purple)]/20 text-[var(--rocket-purple-light)] text-xs flex items-center justify-center">2</span>
            <span>Toque em Menu ⋮ ou Configurações</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--rocket-purple)]/20 text-[var(--rocket-purple-light)] text-xs flex items-center justify-center">3</span>
            <span>Selecione &quot;Aparelhos conectados&quot;</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--rocket-purple)]/20 text-[var(--rocket-purple-light)] text-xs flex items-center justify-center">4</span>
            <span>Aponte a câmera para este QR Code</span>
          </li>
        </ol>
      </div>

      {/* Refresh button */}
      <Button
        variant="ghost"
        size="sm"
        className="mt-6"
        onClick={handleRefetch}
        leftIcon={<RefreshCw className="w-4 h-4" />}
      >
        Gerar novo QR Code
      </Button>
    </div>
  );
}

export default QRCodeDisplay;

