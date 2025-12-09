"use client";

import { LottieIcon } from "@/components/ui";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import dashboardAnimation from "../../../public/grafico-de-barras.json";
import htmlAnimation from "../../../public/html.json";
import instanceAnimation from "../../../public/responsivo.json";

const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/FBGwMYACSqjBQnIXZqZMdy";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: <LottieIcon animationData={dashboardAnimation} className="w-5 h-5" />,
    href: "/",
  },
  {
    label: "Instâncias",
    icon: <LottieIcon animationData={instanceAnimation} className="w-5 h-5" />,
    href: "/instances",
  },
];

const bottomNavItems: NavItem[] = [
  {
    label: "Documentação",
    icon: <LottieIcon animationData={htmlAnimation} className="w-5 h-5" />,
    href: "/docs",
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 248 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "sticky top-0 h-screen z-30",
        "bg-[#1a1a24] border-r border-[#29292e]",
        "flex flex-col"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#29292e]">
        <Link href="/" className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 15 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          >
            <Image
              src="/whatsapp.svg"
              alt="TurboZap Logo"
              width={40}
              height={40}
              className="w-10 h-10"
            />
          </motion.div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <span className="font-bold text-lg text-[var(--rocket-gray-50)] whitespace-nowrap">
                  TurboZap
                </span>
                <span className="block text-xs text-[var(--rocket-gray-400)] whitespace-nowrap">
                  WhatsApp Manager
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          // For dashboard (root path), match exactly "/" or ""
          // For other routes, match exact path or if pathname starts with the href
          const isActive =
            item.href === "/"
              ? pathname === "/" || pathname === ""
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  "relative overflow-hidden group",
                  isActive
                    ? "bg-[var(--rocket-purple)]/20 text-[var(--rocket-purple-light)]"
                    : "text-[var(--rocket-gray-300)] hover:bg-[var(--rocket-gray-700)] hover:text-[var(--rocket-gray-50)]"
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--rocket-purple)]"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}

                <span className="flex-shrink-0">{item.icon}</span>

                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex-1 whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {!isCollapsed && item.badge && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[var(--rocket-gray-600)] text-[var(--rocket-gray-300)]"
                  >
                    {item.badge}
                  </motion.span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom navigation */}
      <div className="p-3 border-t border-[#29292e] space-y-1">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-[var(--rocket-purple)]/20 text-[var(--rocket-purple-light)]"
                    : "text-[var(--rocket-gray-400)] hover:bg-[var(--rocket-gray-700)] hover:text-[var(--rocket-gray-50)]"
                )}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}

        {/* WhatsApp Group Button */}
        <a
          href={WHATSAPP_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-2"
        >
          <motion.button
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
              "backdrop-blur-lg border border-green-500/20",
              "bg-gradient-to-tr from-black/60 to-black/40",
              "shadow-lg hover:shadow-2xl hover:shadow-green-500/30",
              "transition-all duration-300 ease-out",
              "hover:border-green-500/50",
              "hover:bg-gradient-to-tr hover:from-green-500/10 hover:to-black/40",
              "overflow-hidden"
            )}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out rounded-lg" />

            {/* Content */}
            <div className="relative z-10 flex items-center gap-3 flex-1 min-w-0">
              {/* WhatsApp Icon */}
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                <Image
                  src="/whatsapp.svg"
                  alt="WhatsApp"
                  width={20}
                  height={20}
                  className="w-5 h-5 text-green-500 group-hover:text-green-400 transition-colors duration-300"
                />
              </div>

              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium text-green-400 group-hover:text-green-300 transition-colors duration-300 whitespace-nowrap overflow-hidden"
                  >
                    Grupo WhatsApp
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.button>
        </a>
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "absolute -right-3 top-20 z-10",
          "w-6 h-6 rounded-full",
          "bg-[#29292e] border border-[#29292e]",
          "flex items-center justify-center",
          "text-[var(--rocket-gray-400)] hover:text-[var(--rocket-gray-50)]",
          "transition-colors"
        )}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </motion.aside>
  );
}
