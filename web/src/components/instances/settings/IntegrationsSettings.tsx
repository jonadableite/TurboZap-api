"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import { Package, ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";

interface IntegrationsSettingsProps {
  instanceName: string;
}

export function IntegrationsSettings({ instanceName: _instanceName }: IntegrationsSettingsProps) {
  void _instanceName;
  const integrations = [
    {
      name: "Zapier",
      description: "Conecte com milhares de aplicativos via Zapier",
      status: "coming_soon",
      link: "#",
    },
    {
      name: "Make (Integromat)",
      description: "Automatize workflows com Make",
      status: "coming_soon",
      link: "#",
    },
    {
      name: "n8n",
      description: "Automação de workflows open-source",
      status: "coming_soon",
      link: "#",
    },
    {
      name: "Pipedream",
      description: "Plataforma de integração serverless",
      status: "coming_soon",
      link: "#",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-[var(--rocket-gray-600)] bg-[var(--rocket-gray-800)]/50 backdrop-blur-sm">
        <CardHeader className="border-b border-[var(--rocket-gray-600)]">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--rocket-purple)]/10">
              <Package className="w-5 h-5 text-[var(--rocket-purple)]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--rocket-gray-100)]">Integrações</h2>
              <CardDescription className="mt-1">
                Conecte a TurboZap com outras plataformas e serviços
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {integrations.map((integration, index) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="p-4 rounded-lg border border-[var(--rocket-gray-600)] bg-[var(--rocket-gray-800)]/30 hover:border-[var(--rocket-purple)]/30 hover:bg-[var(--rocket-gray-800)]/50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-[var(--rocket-gray-100)]">
                      {integration.name}
                    </h4>
                    {integration.status === "coming_soon" && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Em breve
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-[var(--rocket-gray-400)] leading-relaxed">
                    {integration.description}
                  </p>
                </div>
                <Link
                  href={integration.link}
                  className="p-2 rounded-lg hover:bg-[var(--rocket-gray-700)] transition-colors ml-4"
                >
                  <ExternalLink className="w-4 h-4 text-[var(--rocket-gray-400)] hover:text-[var(--rocket-purple)] transition-colors" />
                </Link>
              </div>
            </motion.div>
          ))}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 rounded-lg bg-gradient-to-r from-[var(--rocket-purple)]/10 to-[var(--rocket-purple)]/5 border border-[var(--rocket-purple)]/20"
        >
          <p className="text-sm text-[var(--rocket-gray-300)] leading-relaxed">
            <strong className="text-[var(--rocket-purple-light)]">
              Quer uma integração específica?
            </strong>
            <br />
            Entre em contato conosco ou abra uma issue no GitHub para solicitar novas integrações.
          </p>
        </motion.div>
      </CardContent>
    </Card>
    </motion.div>
  );
}

