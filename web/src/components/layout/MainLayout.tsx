'use client';

import { Sidebar } from './Sidebar';
import { ToastProvider } from '@/components/ui';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#13131b]">
        <div className="flex min-h-screen w-full">
          <Sidebar />

          <div className="flex-1 min-h-screen overflow-y-auto overflow-x-hidden bg-[#13131b]">
            {children}
          </div>
        </div>

      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, var(--rocket-purple) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, var(--rocket-green) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </div>
      </div>
    </ToastProvider>
  );
}

export default MainLayout;

