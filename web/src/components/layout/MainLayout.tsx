'use client';

import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--rocket-gray-900)]">
      <div className="flex min-h-screen w-full">
        <Sidebar />

        <div className="flex-1 min-h-screen overflow-y-auto bg-[var(--rocket-gray-900)]/95">
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
  );
}

export default MainLayout;

