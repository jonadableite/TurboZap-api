'use client';

import { useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Portal } from './Portal';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
    );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                type: 'spring',
                duration: 0.3,
                bounce: 0.2,
              }}
              className={cn(
                'relative w-full max-h-[90vh] flex flex-col',
                'bg-[var(--rocket-gray-800)] rounded-xl',
                'border border-[var(--rocket-gray-600)]',
                'shadow-2xl shadow-black/50',
                sizes[size]
              )}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-start justify-between p-6 pb-0 flex-shrink-0">
                  <div className="flex-1 min-w-0 pr-4">
                    {title && (
                      <h2 className="text-xl font-semibold text-[var(--rocket-gray-50)]">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p className="mt-1 text-sm text-[var(--rocket-gray-400)]">
                        {description}
                      </p>
                    )}
                  </div>
                  {showCloseButton && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      className={cn(
                        'p-2 rounded-lg flex-shrink-0',
                        'text-[var(--rocket-gray-400)] hover:text-[var(--rocket-gray-50)]',
                        'hover:bg-[var(--rocket-gray-700)]',
                        'transition-colors duration-200'
                      )}
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>
              )}

              {/* Body - Scrollable */}
              <div className="p-6 overflow-y-auto flex-1 min-h-0">
                {children}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 pt-4 mt-4',
        'border-t border-[var(--rocket-gray-600)]',
        className
      )}
    >
      {children}
    </div>
  );
}

export default Modal;

