"use client";

import { BehaviorSettings } from "@/components/instances/settings/BehaviorSettings";
import { InstanceSettingsSidebar } from "@/components/instances/settings/InstanceSettingsSidebar";
import { IntegrationsSettings } from "@/components/instances/settings/IntegrationsSettings";
import { ProxySettings } from "@/components/instances/settings/ProxySettings";
import { RabbitMQSettings } from "@/components/instances/settings/RabbitMQSettings";
import { SQSSettings } from "@/components/instances/settings/SQSSettings";
import { WebhookSettings } from "@/components/instances/settings/WebhookSettings";
import { WebSocketSettings } from "@/components/instances/settings/WebSocketSettings";
import { Header } from "@/components/layout";
import { LottieIcon, Spinner } from "@/components/ui";
import { useInstance } from "@/hooks/useInstances";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import settingsAnimation from "../../../../../../public/definicoes.json";
import arrowAnimation from "../../../../../../public/diagrama.json";

type SettingsSection =
  | "behavior"
  | "proxy"
  | "webhook"
  | "websocket"
  | "rabbitmq"
  | "sqs"
  | "integrations";

export default function InstanceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const instanceName = params?.name as string;
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("behavior");

  const { data: instance, isLoading } = useInstance(instanceName);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#13131b]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <Spinner size="lg" className="mx-auto mb-4" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Sparkles className="w-6 h-6 text-[var(--rocket-purple)]" />
            </motion.div>
          </div>
          <p className="text-[var(--rocket-gray-400)] mt-4 animate-pulse">
            Carregando configurações...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#13131b]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--rocket-danger)]/10 flex items-center justify-center">
            <LottieIcon
              animationData={settingsAnimation}
              className="w-10 h-10"
            />
          </div>
          <h2 className="text-2xl font-bold text-[var(--rocket-gray-100)] mb-2">
            Instância não encontrada
          </h2>
          <p className="text-[var(--rocket-gray-400)] mb-6">
            A instância que você está procurando não existe ou foi removida.
          </p>
          <button
            onClick={() => router.push("/instances")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--rocket-purple)] text-white hover:bg-[var(--rocket-purple)]/90 transition-all duration-200 shadow-lg shadow-[var(--rocket-purple)]/20"
          >
            <LottieIcon animationData={arrowAnimation} className="w-4 h-4" />
            Voltar para instâncias
          </button>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case "behavior":
        return <BehaviorSettings instanceName={instanceName} />;
      case "proxy":
        return <ProxySettings instanceName={instanceName} />;
      case "webhook":
        return <WebhookSettings instanceName={instanceName} />;
      case "websocket":
        return <WebSocketSettings instanceName={instanceName} />;
      case "rabbitmq":
        return <RabbitMQSettings instanceName={instanceName} />;
      case "sqs":
        return <SQSSettings instanceName={instanceName} />;
      case "integrations":
        return <IntegrationsSettings instanceName={instanceName} />;
      default:
        return <BehaviorSettings instanceName={instanceName} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#13131b]">
      <Header
        title={`Configurações - ${instance.name}`}
        description="Gerencie as configurações da instância"
      />

      <div className="px-4 sm:px-8 lg:px-14 py-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-6 text-sm"
        >
          <button
            onClick={() => router.push("/instances")}
            className="text-[var(--rocket-gray-400)] hover:text-[var(--rocket-gray-100)] transition-colors"
          >
            Instâncias
          </button>
          <span className="text-[var(--rocket-gray-600)]">/</span>
          <span className="text-[var(--rocket-gray-300)] font-medium">
            {instance.name}
          </span>
          <span className="text-[var(--rocket-gray-600)]">/</span>
          <span className="text-[var(--rocket-purple-light)] font-semibold">
            Configurações
          </span>
        </motion.nav>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-1"
          >
            <InstanceSettingsSidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
          </motion.div>

          {/* Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
