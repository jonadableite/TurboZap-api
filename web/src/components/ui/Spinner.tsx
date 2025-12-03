'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div className={cn('relative', sizes[size], className)}>
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-[var(--rocket-purple)]/20"
      />
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--rocket-purple)]"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Carregando...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--rocket-gray-900)]/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <Spinner size="lg" />
        <p className="text-[var(--rocket-gray-100)] font-medium">{message}</p>
      </motion.div>
    </div>
  );
}

export default Spinner;

