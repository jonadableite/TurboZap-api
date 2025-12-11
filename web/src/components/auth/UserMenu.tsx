"use client";

import { useAuth, UserRole } from "@/hooks/useAuth";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Code,
  LogOut,
  Settings,
  Shield,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const roleConfig: Record<
  UserRole,
  { label: string; color: string; icon: typeof Shield }
> = {
  USER: {
    label: "Usuário",
    color: "bg-[#8257e5]/20 text-[#8257e5]",
    icon: User,
  },
  DEVELOPER: {
    label: "Developer",
    color: "bg-[#04d361]/20 text-[#04d361]",
    icon: Code,
  },
  ADMIN: {
    label: "Admin",
    color: "bg-[#f75a68]/20 text-[#f75a68]",
    icon: Shield,
  },
};

export function UserMenu() {
  const { user, isLoading, isAuthenticated, isAdmin, isDeveloper, logout } =
    useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  if (isLoading) {
    return (
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-[#29292e] animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Link
        href="/sign-in"
        className="px-4 py-2 bg-[#8257e5] text-white rounded-lg hover:bg-[#996dff] transition-colors font-medium"
      >
        Entrar
      </Link>
    );
  }

  const roleInfo = roleConfig[user.role];
  const RoleIcon = roleInfo.icon;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#202024] transition-colors"
      >
        {/* Avatar */}
        <div className="relative">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#29292e]"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8257e5] to-[#633bbc] flex items-center justify-center text-white font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Online indicator */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#04d361] rounded-full border-2 border-[#121214]" />
        </div>

        {/* User Info (hidden on mobile) */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-white truncate max-w-[120px]">
            {user.name}
          </p>
          <p className="text-xs text-[#7c7c8a] truncate max-w-[120px]">
            {user.email}
          </p>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-[#7c7c8a] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 top-full mt-2 z-30 w-64 overflow-hidden rounded-2xl border border-white/14 bg-[var(--rocket-gray-900)]/85 backdrop-blur-xl backdrop-saturate-150 shadow-[0_24px_60px_rgba(0,0,0,0.5)] ring-1 ring-[var(--rocket-purple)]/18"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--rocket-purple)]/18 via-transparent to-[var(--rocket-blue,#38bdf8)]/14 pointer-events-none" />

              <div className="relative p-2 space-y-1">
                {/* User Header */}
                <div className="px-3 py-2.5 mb-1">
                  <div className="flex items-center gap-3 mb-3">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--rocket-purple)] to-[var(--rocket-purple)]/60 flex items-center justify-center text-white font-bold text-sm border border-[var(--rocket-purple)]/30">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--rocket-gray-50)] truncate text-sm">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-[var(--rocket-gray-400)] truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${roleInfo.color} border border-white/10`}
                    >
                      <RoleIcon className="w-3.5 h-3.5" />
                      {roleInfo.label}
                    </span>
                  </div>
                </div>

                <div className="h-px my-1 bg-white/10" />

                {/* Menu Items */}
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-3 rounded-xl transition-all hover:bg-white/12 active:scale-[0.99] text-[var(--rocket-purple-light)]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--rocket-purple)]/16 border border-[var(--rocket-purple)]/28 shadow-[0_12px_36px_rgba(130,87,229,0.28)]">
                    <Settings className="w-5 h-5" />
                  </span>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Configurações</div>
                    <div className="text-[11px] text-[var(--rocket-gray-400)]">
                      Chaves de API e configurações
                    </div>
                  </div>
                </Link>

                <div className="h-px my-1 bg-white/10" />

                {/* Logout */}
                <button
                  onClick={async () => {
                    setIsOpen(false);
                    await logout();
                  }}
                  className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-3 rounded-xl transition-all hover:bg-white/12 active:scale-[0.99] text-[var(--rocket-danger)]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--rocket-danger)]/16 border border-[var(--rocket-danger)]/28 shadow-[0_12px_36px_rgba(247,90,104,0.28)]">
                    <LogOut className="w-5 h-5" />
                  </span>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Sair</div>
                    <div className="text-[11px] text-[var(--rocket-gray-400)]">
                      Finaliza a sessão atual
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UserMenu;
