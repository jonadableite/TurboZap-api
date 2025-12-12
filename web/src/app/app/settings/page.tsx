"use client";

import { Header } from "@/components/layout";
import { ApiKeysSection } from "@/components/settings/ApiKeysSection";
import { GlobalApiKeySection } from "@/components/settings/GlobalApiKeySection";
import { motion } from "framer-motion";

export default function SettingsPage() {
  return (
    <>
      <Header
        title="Configurações"
        description="Gerencie suas configurações e chaves de API"
      />

      <div className="px-4 sm:px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Global API Key Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlobalApiKeySection />
        </motion.div>

        {/* User API Keys Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ApiKeysSection />
        </motion.div>
      </div>
    </>
  );
}

