"use client";

import { motion } from "framer-motion";
import {
  Settings,
  Webhook,
  Radio,
  Zap,
  Network,
  Package,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SettingsSection =
  | "behavior"
  | "proxy"
  | "webhook"
  | "websocket"
  | "rabbitmq"
  | "sqs"
  | "integrations";

interface SidebarItem {
  id: SettingsSection;
  label: string;
  icon: React.ReactNode;
  children?: { id: string; label: string }[];
}

interface InstanceSettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

const sidebarItems: SidebarItem[] = [
  {
    id: "behavior",
    label: "Comportamento",
    icon: <Settings className="w-4 h-4" />,
  },
  {
    id: "proxy",
    label: "Proxy",
    icon: <Network className="w-4 h-4" />,
  },
  {
    id: "webhook",
    label: "Webhook",
    icon: <Webhook className="w-4 h-4" />,
  },
  {
    id: "websocket",
    label: "WebSocket",
    icon: <Radio className="w-4 h-4" />,
  },
  {
    id: "rabbitmq",
    label: "RabbitMQ",
    icon: <Zap className="w-4 h-4" />,
  },
  {
    id: "sqs",
    label: "SQS",
    icon: <Package className="w-4 h-4" />,
  },
  {
    id: "integrations",
    label: "Integrações",
    icon: <Package className="w-4 h-4" />,
  },
];

export function InstanceSettingsSidebar({
  activeSection,
  onSectionChange,
}: InstanceSettingsSidebarProps) {
  return (
    <div className="space-y-2">
      {sidebarItems.map((item, index) => {
        const isActive = activeSection === item.id;
        return (
          <motion.button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
              "text-left relative group",
              isActive
                ? "bg-[var(--rocket-purple)]/20 text-[var(--rocket-purple-light)] border border-[var(--rocket-purple)]/30 shadow-lg shadow-[var(--rocket-purple)]/10"
                : "text-[var(--rocket-gray-300)] hover:bg-[var(--rocket-gray-800)] hover:text-[var(--rocket-gray-100)] border border-transparent"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeSection"
                className="absolute inset-0 rounded-lg bg-[var(--rocket-purple)]/10 border border-[var(--rocket-purple)]/30"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span
              className={cn(
                "relative z-10 transition-colors",
                isActive && "text-[var(--rocket-purple)]"
              )}
            >
              {item.icon}
            </span>
            <span className="relative z-10 flex-1 font-medium">{item.label}</span>
            <motion.div
              className="relative z-10"
              initial={false}
              animate={{ rotate: isActive ? 0 : -90, opacity: isActive ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-[var(--rocket-purple)]" />
            </motion.div>
          </motion.button>
        );
      })}
    </div>
  );
}

