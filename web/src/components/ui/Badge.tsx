'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  pulse?: boolean;
  icon?: React.ReactNode;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-[var(--rocket-gray-600)] text-[var(--rocket-gray-100)]',
  success: 'bg-[var(--rocket-green)]/20 text-[var(--rocket-green)] border-[var(--rocket-green)]/30',
  warning: 'bg-[var(--rocket-warning)]/20 text-[var(--rocket-warning)] border-[var(--rocket-warning)]/30',
  danger: 'bg-[var(--rocket-danger)]/20 text-[var(--rocket-danger)] border-[var(--rocket-danger)]/30',
  info: 'bg-[var(--rocket-info)]/20 text-[var(--rocket-info)] border-[var(--rocket-info)]/30',
  purple: 'bg-[var(--rocket-purple)]/20 text-[var(--rocket-purple-light)] border-[var(--rocket-purple)]/30',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', pulse = false, icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border',
          'transition-all duration-200',
          variants[variant],
          className
        )}
        {...props}
      >
        {pulse && (
          <motion.span
            className={cn(
              'w-2 h-2 rounded-full',
              variant === 'success' && 'bg-[var(--rocket-green)]',
              variant === 'warning' && 'bg-[var(--rocket-warning)]',
              variant === 'danger' && 'bg-[var(--rocket-danger)]',
              variant === 'info' && 'bg-[var(--rocket-info)]',
              variant === 'purple' && 'bg-[var(--rocket-purple)]',
              variant === 'default' && 'bg-[var(--rocket-gray-400)]'
            )}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
        {icon}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;

