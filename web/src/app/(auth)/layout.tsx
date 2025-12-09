"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0D0D0F] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#8257e5]/20 via-[#0D0D0F] to-[#04d361]/10" />
        
        {/* Animated Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(130, 87, 229, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(130, 87, 229, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Glowing Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#8257e5]/30 blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-[#04d361]/20 blur-[100px]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 mb-12">
              <div className="relative">
                <div className="absolute inset-0 bg-[#8257e5] blur-xl opacity-50" />
                <div className="relative bg-gradient-to-br from-[#8257e5] to-[#633bbc] p-3 rounded-xl">
                  <Zap className="w-8 h-8 text-white" fill="currentColor" />
                </div>
              </div>
              <span className="text-3xl font-bold text-white">TurboZap</span>
            </Link>

            {/* Headline */}
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Automatize seu{" "}
              <span className="bg-gradient-to-r from-[#8257e5] to-[#04d361] bg-clip-text text-transparent">
                WhatsApp
              </span>
              <br />
              de forma inteligente
            </h1>

            <p className="text-lg text-[#a9a9b2] mb-12 max-w-md">
              Crie instâncias, envie mensagens em massa e integre com seus sistemas através de nossa API poderosa.
            </p>

            {/* Features */}
            <div className="space-y-4">
              {[
                "API RESTful completa e documentada",
                "Webhooks em tempo real",
                "Multi-instâncias simultâneas",
                "Painel de controle intuitivo",
              ].map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-[#04d361]" />
                  <span className="text-[#c4c4cc]">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>

      {/* Mobile Logo (shown only on small screens) */}
      <div className="lg:hidden fixed top-6 left-6 z-20">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-[#8257e5] to-[#633bbc] p-2 rounded-lg">
            <Zap className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <span className="text-xl font-bold text-white">TurboZap</span>
        </Link>
      </div>
    </div>
  );
}

