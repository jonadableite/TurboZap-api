"use client";

import { CreateInstanceModal } from "@/components/instances";
import { Header } from "@/components/layout";
import {
  Badge,
  Button,
  LottieIcon,
  Spinner,
} from "@/components/ui";
import { useApiConfig } from "@/hooks/useApiConfig";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useInstances } from "@/hooks/useInstances";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Plus, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import messageAnimation from "../../../public/balao-de-fala.json";
import clockAnimation from "../../../public/desconectar.json";
import trendingAnimation from "../../../public/grafico-de-linha.json";
import smartphoneAnimation from "../../../public/responsivo.json";
import activityAnimation from "../../../public/wi-fi-global.json";

export default function DashboardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: instances = [], isLoading } = useInstances();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { hasApiKey } = useApiConfig();
  const canCreateInstance = hasApiKey;

  const connectedCount = instances.filter(
    (i) => i.status === "connected"
  ).length;
  const disconnectedCount = instances.filter(
    (i) => i.status === "disconnected"
  ).length;
  const messagesToday = stats?.today || 0;
  const messagesTotal = stats?.total || 0;

  return (
    <>
      <Header title="Dashboard" description="Visão geral do seu TurboZap" />

      <div className="px-4 sm:px-8 lg:px-14 py-8 space-y-8 max-w-6xl mx-auto w-full">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--rocket-purple)]/20 via-[var(--rocket-purple)]/10 to-transparent border border-[var(--rocket-purple)]/30 p-4 sm:p-6 md:p-8"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-6 h-6 text-[var(--rocket-purple)]" />
              <Badge variant="purple">TurboZap API</Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--rocket-gray-50)] mb-2">
              Bem-vindo ao TurboZap! 🚀
            </h2>
            <p className="text-[var(--rocket-gray-300)] max-w-2xl mb-6 pr-0 sm:pr-36 md:pr-52 lg:pr-64 xl:pr-72 2xl:pr-80">
              Gerencie suas instâncias do WhatsApp, envie mensagens em massa,
              configure webhooks e muito mais com nossa API poderosa e fácil de
              usar.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button
                onClick={() => canCreateInstance && setShowCreateModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
                disabled={!canCreateInstance}
                title={
                  !canCreateInstance
                    ? "Configure sua API Key em Configurações"
                    : undefined
                }
              >
                Nova instância
              </Button>
              <Link href="/instances">
                <Button
                  variant="outline"
                  rightIcon={
                    <LottieIcon
                      animationData={smartphoneAnimation}
                      className="w-4 h-4"
                    />
                  }
                >
                  Ver instâncias
                </Button>
              </Link>
            </div>
          </div>

          {/* Android Image - Front Layer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 50 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              x: 0
            }}
            transition={{ 
              delay: 0.3, 
              duration: 0.6, 
              ease: "easeOut"
            }}
            className="absolute top-0 right-0 w-24 h-24 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-72 lg:h-72 xl:w-80 xl:h-80 2xl:w-96 2xl:h-96 z-20 pointer-events-none overflow-visible -mr-2 sm:mr-0"
          >
            <div className="relative w-full h-full">
              <Image
                src="/bg_white-removebg-preview.png"
                alt="Android Device"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 640px) 96px, (max-width: 768px) 160px, (max-width: 1024px) 224px, (max-width: 1280px) 288px, (max-width: 1536px) 320px, 384px"
                style={{
                  filter: "drop-shadow(0 25px 50px rgba(139, 92, 246, 0.4)) drop-shadow(0 0 30px rgba(139, 92, 246, 0.2))",
                }}
              />
              {/* Static Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--rocket-purple)]/20 via-transparent to-transparent rounded-full blur-3xl" />
            </div>
          </motion.div>

          {/* Decorative SVG elements - Back Layer */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-20 z-10">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop
                    offset="0%"
                    style={{ stopColor: "var(--rocket-purple)" }}
                  />
                  <stop offset="100%" style={{ stopColor: "transparent" }} />
                </linearGradient>
              </defs>
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="url(#grad)"
                strokeWidth="2"
              />
              <circle
                cx="100"
                cy="100"
                r="60"
                fill="none"
                stroke="url(#grad)"
                strokeWidth="1.5"
              />
              <circle
                cx="100"
                cy="100"
                r="40"
                fill="none"
                stroke="url(#grad)"
                strokeWidth="1"
              />
            </svg>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Instances */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="rounded-xl bg-[#1a1a24] border border-[#29292e] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[var(--rocket-gray-400)]">
                  Total Instâncias
                </p>
                <div className="w-10 h-10 rounded-lg bg-[var(--rocket-purple)]/10 flex items-center justify-center">
                  <LottieIcon
                    animationData={smartphoneAnimation}
                    className="w-5 h-5"
                  />
                </div>
              </div>
              {isLoading ? (
                <Spinner size="sm" />
              ) : (
                <p className="text-2xl font-semibold text-[var(--rocket-gray-50)] mb-3">
                  {instances.length}
                </p>
              )}
              <div className="flex items-center gap-1 text-xs text-[var(--rocket-gray-400)]">
                <LottieIcon
                  animationData={trendingAnimation}
                  className="w-3 h-3"
                />
                <span className="text-[var(--rocket-green)]">+12%</span>
                <span>vs mês anterior</span>
              </div>
            </div>
          </motion.div>

          {/* Connected */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="rounded-xl bg-[#1a1a24] border border-[#29292e] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[var(--rocket-gray-400)]">
                  Conectadas
                </p>
                <div className="w-10 h-10 rounded-lg bg-[var(--rocket-green)]/10 flex items-center justify-center">
                  <LottieIcon
                    animationData={activityAnimation}
                    className="w-5 h-5"
                  />
                </div>
              </div>
              {isLoading ? (
                <Spinner size="sm" />
              ) : (
                <p className="text-2xl font-semibold text-[var(--rocket-green)] mb-3">
                  {connectedCount}
                </p>
              )}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[#29292e] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: instances.length
                        ? `${(connectedCount / instances.length) * 100}%`
                        : "0%",
                    }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="h-full bg-[var(--rocket-green)] rounded-full"
                  />
                </div>
                <span className="text-xs text-[var(--rocket-gray-400)]">
                  {instances.length
                    ? Math.round((connectedCount / instances.length) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </motion.div>

          {/* Disconnected */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="rounded-xl bg-[#1a1a24] border border-[#29292e] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[var(--rocket-gray-400)]">
                  Desconectadas
                </p>
                <div className="w-10 h-10 rounded-lg bg-[var(--rocket-danger)]/10 flex items-center justify-center">
                  <LottieIcon
                    animationData={clockAnimation}
                    className="w-5 h-5"
                  />
                </div>
              </div>
              {isLoading ? (
                <Spinner size="sm" />
              ) : (
                <p className="text-2xl font-semibold text-[var(--rocket-danger)] mb-3">
                  {disconnectedCount}
                </p>
              )}
              {disconnectedCount > 0 && (
                <Link href="/instances">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-xs h-8"
                  >
                    Reconectar
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>

          {/* Messages Today */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="rounded-xl bg-[#1a1a24] border border-[#29292e] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[var(--rocket-gray-400)]">
                  Mensagens Hoje
                </p>
                <div className="w-10 h-10 rounded-lg bg-[var(--rocket-info)]/10 flex items-center justify-center">
                  <LottieIcon
                    animationData={messageAnimation}
                    className="w-5 h-5"
                  />
                </div>
              </div>
              {statsLoading ? (
                <Spinner size="sm" />
              ) : (
                <p className="text-2xl font-semibold text-[var(--rocket-gray-50)] mb-3">
                  {messagesToday.toLocaleString("pt-BR")}
                </p>
              )}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[var(--rocket-gray-400)]">Total:</span>
                <span className="text-[var(--rocket-info)] font-medium">
                  {messagesTotal.toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Instances */}
        {instances.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[var(--rocket-gray-50)]">
                Instâncias recentes
              </h3>
              <Link href="/instances">
                <Button
                  variant="ghost"
                  size="sm"
                  rightIcon={
                    <LottieIcon
                      animationData={smartphoneAnimation}
                      className="w-4 h-4"
                    />
                  }
                >
                  Ver todas
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instances.slice(0, 3).map((instance, index) => (
                <motion.div
                  key={instance.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="rounded-xl bg-[#1a1a24] border border-[#29292e] p-4 group hover:border-[#29292e] transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center",
                          instance.status === "connected"
                            ? "bg-[var(--rocket-green)]/10"
                            : "bg-[#29292e]"
                        )}
                      >
                        <LottieIcon
                          animationData={smartphoneAnimation}
                          className={cn(
                            "w-4 h-4",
                            instance.status === "connected"
                              ? "text-[var(--rocket-green)]"
                              : "text-[var(--rocket-gray-400)]"
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-[var(--rocket-gray-50)] truncate">
                          {instance.profileName || instance.name}
                        </h4>
                        <p className="text-xs text-[var(--rocket-gray-400)]">
                          {instance.status === "connected"
                            ? "Conectado"
                            : "Desconectado"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          instance.status === "connected" ? "success" : "danger"
                        }
                        pulse={instance.status === "connected"}
                      >
                        {instance.status === "connected" ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Instance Modal */}
      <CreateInstanceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
      />
    </>
  );
}
