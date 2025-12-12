"use client";

import { cn } from "@/lib/utils";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Layers,
  Webhook,
  FileImage,
  Shield,
  Zap,
  Activity,
} from "lucide-react";
import { useRef, useState } from "react";

interface BentoCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  background?: React.ReactNode;
  index: number;
}

function BentoCard({
  title,
  description,
  icon,
  className,
  background,
  index,
}: BentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 300 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        "bg-[#1a1a24] border border-[#29292e]",
        "transition-all duration-300",
        "hover:border-[var(--rocket-purple)]/50 hover:shadow-xl hover:shadow-[var(--rocket-purple)]/10",
        className
      )}
    >
      {/* Background element */}
      {background && (
        <div className="absolute inset-0 opacity-50 group-hover:opacity-100 transition-opacity duration-500">
          {background}
        </div>
      )}

      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${(mouseX.get() + 0.5) * 100}% ${(mouseY.get() + 0.5) * 100}%, rgba(130, 87, 229, 0.15) 0%, transparent 50%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-6 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-[var(--rocket-purple)]/10 border border-[var(--rocket-purple)]/20 text-[var(--rocket-purple)]">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-[var(--rocket-gray-50)]">
            {title}
          </h3>
        </div>
        <p className="text-sm text-[var(--rocket-gray-400)] flex-1">
          {description}
        </p>
      </div>

      {/* Border gradient on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-br from-[var(--rocket-purple)]/20 via-transparent to-[var(--rocket-green)]/10" />
      </div>
    </motion.div>
  );
}

// Animated backgrounds for cards
function MultiInstanceBackground() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="relative w-32 h-32"
      >
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-8 h-12 rounded-lg bg-gradient-to-br from-[var(--rocket-purple)]/20 to-[var(--rocket-purple)]/5 border border-[var(--rocket-purple)]/30"
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-20px)`,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

function WebhookBackground() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 200, opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.6,
            ease: "easeInOut",
          }}
          className="absolute w-20 h-1 rounded-full bg-gradient-to-r from-transparent via-[var(--rocket-green)] to-transparent"
          style={{ top: `${30 + i * 20}%` }}
        />
      ))}
    </div>
  );
}

function MediaBackground() {
  const icons = ["📷", "🎥", "📄", "🎵"];
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {icons.map((icon, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
          className="absolute text-2xl"
          style={{
            left: `${20 + i * 20}%`,
            top: `${40 + (i % 2) * 20}%`,
          }}
        >
          {icon}
        </motion.div>
      ))}
    </div>
  );
}

const features = [
  {
    title: "Multi-instância",
    description:
      "Gerencie múltiplas contas WhatsApp simultaneamente com uma única API. Escale seu atendimento sem limites.",
    icon: <Layers className="w-5 h-5" />,
    className: "md:col-span-2 md:row-span-2",
    background: <MultiInstanceBackground />,
  },
  {
    title: "Webhooks em Tempo Real",
    description:
      "Receba eventos instantaneamente. Mensagens, status de entrega, presença online - tudo em tempo real.",
    icon: <Webhook className="w-5 h-5" />,
    className: "md:col-span-1",
    background: <WebhookBackground />,
  },
  {
    title: "Suporte a Mídia",
    description:
      "Envie imagens, vídeos, documentos, áudios e até figurinhas. Suporte completo a todos os formatos.",
    icon: <FileImage className="w-5 h-5" />,
    className: "md:col-span-1",
    background: <MediaBackground />,
  },
  {
    title: "Segurança Enterprise",
    description:
      "Autenticação via API Key, rate limiting configurável e criptografia de ponta a ponta.",
    icon: <Shield className="w-5 h-5" />,
    className: "md:col-span-1",
  },
  {
    title: "Alta Performance",
    description:
      "Construído em Go para máxima performance. Suporte a milhares de mensagens por segundo.",
    icon: <Zap className="w-5 h-5" />,
    className: "md:col-span-1",
  },
  {
    title: "Observabilidade",
    description:
      "Métricas, logs estruturados e health checks. Monitore tudo em tempo real.",
    icon: <Activity className="w-5 h-5" />,
    className: "md:col-span-1",
  },
];

export function BentoFeatures() {
  return (
    <section className="py-24 px-4 relative">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-[var(--rocket-purple)]/10 text-[var(--rocket-purple)] border border-[var(--rocket-purple)]/20 mb-4 inline-block">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--rocket-gray-50)] mb-4">
            Tudo que você precisa para{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--rocket-purple)] to-[var(--rocket-green)]">
              escalar
            </span>
          </h2>
          <p className="text-lg text-[var(--rocket-gray-400)] max-w-2xl mx-auto">
            Uma API completa para WhatsApp com recursos enterprise e developer
            experience de primeira classe.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[180px]">
          {features.map((feature, index) => (
            <BentoCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              className={feature.className}
              background={feature.background}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

