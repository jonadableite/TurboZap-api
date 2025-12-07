'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedCard({ children, className }: AnimatedCardProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      {/* Animated background pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(4px 100px at 0px 235px, var(--rocket-purple), transparent),
            radial-gradient(4px 100px at 300px 235px, var(--rocket-purple), transparent),
            radial-gradient(1.5px 1.5px at 150px 117.5px, var(--rocket-purple) 100%, transparent 150%)
          `,
          backgroundSize: '300px 235px',
          animation: 'patternMove 150s linear infinite',
        }}
      />
      <div 
        className="absolute inset-0 z-[1]"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, transparent 0, transparent 2px, hsl(0 0 4%) 2px)`,
          backgroundSize: '8px 8px',
          backdropFilter: 'blur(1em) brightness(6)',
          animation: 'patternHue 10s linear infinite',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      <style jsx global>{`
        @keyframes patternMove {
          0% {
            background-position: 0px 220px, 3px 220px, 151.5px 337.5px;
          }
          to {
            background-position: 0px 6800px, 3px 6800px, 151.5px 6917.5px;
          }
        }
        
        @keyframes patternHue {
          0% {
            filter: hue-rotate(0deg);
          }
          to {
            filter: hue-rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

