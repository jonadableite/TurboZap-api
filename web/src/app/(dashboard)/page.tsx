"use client";

import { CreateInstanceModal } from "@/components/instances";
import { Header } from "@/components/layout";
import {
  AnimatedCard,
  Badge,
  Button,
  Card,
  LottieIcon,
  Spinner,
} from "@/components/ui";
import { useApiConfig } from "@/hooks/useApiConfig";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useInstances } from "@/hooks/useInstances";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Plus, Webhook, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import messageAnimation from "../../../public/balao-de-fala.json";
import clockAnimation from "../../../public/desconectar.json";
import arrowAnimation from "../../../public/diagrama.json";
import trendingAnimation from "../../../public/grafico-de-linha.json";
import smartphoneAnimation from "../../../public/responsivo.json";
import activityAnimation from "../../../public/wi-fi-global.json";

export default function DashboardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: instances = [], isLoading } = useInstances();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { hasApiKey } = useApiConfig();
  const router = useRouter();
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
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--rocket-purple)]/20 via-[var(--rocket-purple)]/10 to-transparent border border-[var(--rocket-purple)]/30 p-8"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-6 h-6 text-[var(--rocket-purple)]" />
              <Badge variant="purple">TurboZap API</Badge>
            </div>
            <h2 className="text-2xl font-bold text-[var(--rocket-gray-50)] mb-2">
              Bem-vindo ao TurboZap! 🚀
            </h2>
            <p className="text-[var(--rocket-gray-300)] max-w-2xl mb-6">
              Gerencie suas instâncias do WhatsApp, envie mensagens em massa,
              configure webhooks e muito mais com nossa API poderosa e fácil de
              usar.
            </p>
            <div className="flex items-center gap-4">
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
                      animationData={arrowAnimation}
                      className="w-4 h-4"
                    />
                  }
                >
                  Ver instâncias
                </Button>
              </Link>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-30">
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
            <AnimatedCard>
              <Card className="bg-transparent border-0 shadow-none">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--rocket-gray-400)]">
                      Total Instâncias
                    </p>
                    {isLoading ? (
                      <Spinner size="sm" />
                    ) : (
                      <p className="text-3xl font-bold text-[var(--rocket-gray-50)]">
                        {instances.length}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[var(--rocket-purple)]/20 flex items-center justify-center">
                    <LottieIcon
                      animationData={smartphoneAnimation}
                      className="w-6 h-6"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm">
                  <LottieIcon
                    animationData={trendingAnimation}
                    className="w-4 h-4"
                  />
                  <span className="text-[var(--rocket-green)]">+12%</span>
                  <span className="text-[var(--rocket-gray-400)]">
                    vs mês anterior
                  </span>
                </div>
              </Card>
            </AnimatedCard>
          </motion.div>

          {/* Connected */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AnimatedCard>
              <Card className="bg-transparent border-[var(--rocket-green)]/30 border shadow-none">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--rocket-gray-400)]">
                      Conectadas
                    </p>
                    {isLoading ? (
                      <Spinner size="sm" />
                    ) : (
                      <p className="text-3xl font-bold text-[var(--rocket-green)]">
                        {connectedCount}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[var(--rocket-green)]/20 flex items-center justify-center">
                    <LottieIcon
                      animationData={activityAnimation}
                      className="w-6 h-6"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-[var(--rocket-gray-700)] rounded-full overflow-hidden">
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
                  <span className="text-sm text-[var(--rocket-gray-400)]">
                    {instances.length
                      ? Math.round((connectedCount / instances.length) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </Card>
            </AnimatedCard>
          </motion.div>

          {/* Disconnected */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <AnimatedCard>
              <Card className="bg-transparent border-[var(--rocket-danger)]/30 border shadow-none">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--rocket-gray-400)]">
                      Desconectadas
                    </p>
                    {isLoading ? (
                      <Spinner size="sm" />
                    ) : (
                      <p className="text-3xl font-bold text-[var(--rocket-danger)]">
                        {disconnectedCount}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[var(--rocket-danger)]/20 flex items-center justify-center">
                    <LottieIcon
                      animationData={clockAnimation}
                      className="w-6 h-6"
                    />
                  </div>
                </div>
                {disconnectedCount > 0 && (
                  <div className="mt-4">
                    <Link href="/instances">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center"
                      >
                        Reconectar
                      </Button>
                    </Link>
                  </div>
                )}
              </Card>
            </AnimatedCard>
          </motion.div>

          {/* Messages Today */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <AnimatedCard>
              <Card className="bg-transparent border-0 shadow-none">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--rocket-gray-400)]">
                      Mensagens Hoje
                    </p>
                    {statsLoading ? (
                      <Spinner size="sm" />
                    ) : (
                      <p className="text-3xl font-bold text-[var(--rocket-gray-50)]">
                        {messagesToday.toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[var(--rocket-info)]/20 flex items-center justify-center">
                    <LottieIcon
                      animationData={messageAnimation}
                      className="w-6 h-6"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm">
                  <span className="text-[var(--rocket-gray-400)]">Total:</span>
                  <span className="text-[var(--rocket-info)] font-semibold">
                    {messagesTotal.toLocaleString("pt-BR")}
                  </span>
                </div>
              </Card>
            </AnimatedCard>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-[var(--rocket-gray-50)] mb-4">
            Ações rápidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Create Instance */}
            <motion.button
              onClick={() =>
                canCreateInstance
                  ? setShowCreateModal(true)
                  : router.push("/settings")
              }
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "p-6 rounded-xl bg-[var(--rocket-gray-800)] border border-[var(--rocket-gray-600)] transition-colors text-left group",
                canCreateInstance
                  ? "hover:border-[var(--rocket-purple)]/50"
                  : "opacity-60 border-dashed cursor-pointer"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--rocket-purple)]/20 flex items-center justify-center mb-4 group-hover:bg-[var(--rocket-purple)]/30 transition-colors">
                <LottieIcon
                  animationData={smartphoneAnimation}
                  className="w-6 h-6"
                />
              </div>
              <h4 className="font-semibold text-[var(--rocket-gray-50)] mb-1">
                Nova Instância
              </h4>
              <p className="text-sm text-[var(--rocket-gray-400)]">
                Crie uma nova conexão WhatsApp
              </p>
              {!canCreateInstance && (
                <p className="text-xs text-[var(--rocket-warning)] mt-3">
                  Configure sua API Key para habilitar
                </p>
              )}
            </motion.button>

            {/* Send Message */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 rounded-xl bg-[var(--rocket-gray-800)] border border-[var(--rocket-gray-600)] text-left opacity-60 cursor-not-allowed"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--rocket-green)]/20 flex items-center justify-center mb-4">
                <LottieIcon
                  animationData={messageAnimation}
                  className="w-6 h-6"
                />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-[var(--rocket-gray-50)]">
                  Enviar Mensagem
                </h4>
                <Badge>Em breve</Badge>
              </div>
              <p className="text-sm text-[var(--rocket-gray-400)]">
                Envie mensagens em massa
              </p>
            </motion.div>

            {/* Configure Webhook */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 rounded-xl bg-[var(--rocket-gray-800)] border border-[var(--rocket-gray-600)] text-left opacity-60 cursor-not-allowed"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--rocket-warning)]/20 flex items-center justify-center mb-4">
                <Webhook className="w-6 h-6 text-[var(--rocket-warning)]" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-[var(--rocket-gray-50)]">
                  Configurar Webhook
                </h4>
                <Badge>Em breve</Badge>
              </div>
              <p className="text-sm text-[var(--rocket-gray-400)]">
                Receba eventos em tempo real
              </p>
            </motion.div>
          </div>
        </div>

        {/* Recent Instances */}
        {instances.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--rocket-gray-50)]">
                Instâncias recentes
              </h3>
              <Link href="/instances">
                <Button
                  variant="ghost"
                  size="sm"
                  rightIcon={
                    <LottieIcon
                      animationData={arrowAnimation}
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
                  <Card className="group">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          instance.status === "connected"
                            ? "bg-[var(--rocket-green)]/20"
                            : "bg-[var(--rocket-gray-700)]"
                        )}
                      >
                        <LottieIcon
                          animationData={smartphoneAnimation}
                          className={cn(
                            "w-5 h-5",
                            instance.status === "connected"
                              ? "text-[var(--rocket-green)]"
                              : "text-[var(--rocket-gray-400)]"
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[var(--rocket-gray-50)] truncate">
                          {instance.profileName || instance.name}
                        </h4>
                        <p className="text-sm text-[var(--rocket-gray-400)]">
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
                  </Card>
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
