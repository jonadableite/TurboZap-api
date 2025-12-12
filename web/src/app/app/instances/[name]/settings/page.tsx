"use client";

import { Header } from "@/components/layout";
import {
  InstanceSettingsSidebar,
  BehaviorSettings,
  WebhookSettings,
  WebSocketSettings,
  RabbitMQSettings,
  SQSSettings,
  ProxySettings,
  IntegrationsSettings,
} from "@/components/instances/settings";
import { useParams } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type SettingsTab =
  | "behavior"
  | "webhook"
  | "websocket"
  | "rabbitmq"
  | "sqs"
  | "proxy"
  | "integrations";

export default function InstanceSettingsPage() {
  const params = useParams();
  const instanceName = params.name as string;
  const [activeTab, setActiveTab] = useState<SettingsTab>("behavior");

  const renderContent = () => {
    switch (activeTab) {
      case "behavior":
        return <BehaviorSettings instanceName={instanceName} />;
      case "webhook":
        return <WebhookSettings instanceName={instanceName} />;
      case "websocket":
        return <WebSocketSettings instanceName={instanceName} />;
      case "rabbitmq":
        return <RabbitMQSettings instanceName={instanceName} />;
      case "sqs":
        return <SQSSettings instanceName={instanceName} />;
      case "proxy":
        return <ProxySettings instanceName={instanceName} />;
      case "integrations":
        return <IntegrationsSettings instanceName={instanceName} />;
      default:
        return <BehaviorSettings instanceName={instanceName} />;
    }
  };

  return (
    <>
      <Header
        title={`Configurações: ${instanceName}`}
        description="Configure sua instância WhatsApp"
      />

      <div className="px-4 sm:px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <InstanceSettingsSidebar
              activeSection={activeTab}
              onSectionChange={setActiveTab}
            />
          </div>

          {/* Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}

