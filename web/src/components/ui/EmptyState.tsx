'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center',
        className
      )}
    >
      {icon && (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="mb-4 text-[var(--rocket-gray-500)]"
        >
          {icon}
        </motion.div>
      )}
      <h3 className="text-lg font-semibold text-[var(--rocket-gray-100)] mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-[var(--rocket-gray-400)] max-w-md mb-6">
          {description}
        </p>
      )}
      {action}
    </motion.div>
  );
}

export default EmptyState;

