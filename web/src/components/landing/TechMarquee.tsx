"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Marquee } from "./Marquee";

const techLogos = [
  { name: "Go", src: "/Go-Logo_Blue.svg", width: 120 },
  { name: "Docker", src: "/landing/tech/docker.svg", width: 110 },
  { name: "Redis", src: "/landing/tech/redis.svg", width: 110 },
  { name: "RabbitMQ", src: "/landing/tech/rabbitmq.svg", width: 110 },
  { name: "WhatsApp", src: "/whatsapp.svg", width: 110 },
  { name: "Next.js", src: "/next.svg", width: 110 },
  { name: "Vercel", src: "/vercel.svg", width: 110 },
  { name: "TypeScript", src: "/programacao-da-web.svg", width: 110 },
];

export function TechMarquee() {
  const [duration, setDuration] = useState(22);

  // Acelera sutilmente o marquee conforme o scroll desce (efeito scroll progress)
  useEffect(() => {
    const onScroll = () => {
      const progress = Math.min(1, window.scrollY / 1200);
      // duração menor = movimento mais rápido (clamp para não exagerar)
      const next = 22 - progress * 6; // de ~22s até ~16s
      setDuration(Number(next.toFixed(2)));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="py-16 relative overflow-hidden border-y border-[#29292e] bg-[#0f0f14]/50">
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-8"
      >
        <span className="text-sm text-[var(--rocket-gray-400)] uppercase tracking-wider">
          Construído com tecnologias modernas
        </span>
      </motion.div>

      <Marquee
        pauseOnHover
        className="[--gap:4rem] will-change-transform"
        style={{ ["--duration" as string]: `${duration}s` }}
      >
        {techLogos.map((tech) => (
          <motion.div
            key={tech.name}
            whileHover={{ scale: 1.08, y: -4 }}
            className="group flex items-center justify-center px-8 py-2 transition-all duration-300"
          >
            <div className="relative">
              <Image
                src={tech.src}
                alt={tech.name}
                width={tech.width}
                height={48}
                className="h-12 w-auto object-contain drop-shadow-[0_8px_24px_rgba(130,87,229,0.15)] group-hover:drop-shadow-[0_10px_28px_rgba(130,87,229,0.35)] transition-all duration-300"
                loading="lazy"
              />
            </div>
          </motion.div>
        ))}
      </Marquee>
    </section>
  );
}

