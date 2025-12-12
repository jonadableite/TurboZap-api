"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export function ParallaxBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const springConfig = { damping: 25, stiffness: 100 };
  const mouseXSpring = useSpring(0, springConfig);
  const mouseYSpring = useSpring(0, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      mouseXSpring.set(x);
      mouseYSpring.set(y);
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseXSpring, mouseYSpring]);

  // Transform values for different layers
  const layer1X = useTransform(mouseXSpring, [-0.5, 0.5], [-30, 30]);
  const layer1Y = useTransform(mouseYSpring, [-0.5, 0.5], [-30, 30]);
  const layer2X = useTransform(mouseXSpring, [-0.5, 0.5], [-60, 60]);
  const layer2Y = useTransform(mouseYSpring, [-0.5, 0.5], [-60, 60]);
  const layer3X = useTransform(mouseXSpring, [-0.5, 0.5], [-100, 100]);
  const layer3Y = useTransform(mouseYSpring, [-0.5, 0.5], [-100, 100]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#13131b] via-[#13131b] to-[#0a0a0f]" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(var(--rocket-purple) 1px, transparent 1px), 
                           linear-gradient(90deg, var(--rocket-purple) 1px, transparent 1px)`,
          backgroundSize: "100px 100px",
        }}
      />

      {/* Layer 1 - Far shapes */}
      <motion.div
        style={{ x: layer1X, y: layer1Y }}
        className="absolute inset-0"
      >
        <div
          className="absolute top-[10%] left-[5%] w-96 h-96 rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, var(--rocket-purple) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute bottom-[20%] right-[10%] w-72 h-72 rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, var(--rocket-green) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
      </motion.div>

      {/* Layer 2 - Mid shapes */}
      <motion.div
        style={{ x: layer2X, y: layer2Y }}
        className="absolute inset-0"
      >
        <div
          className="absolute top-[30%] right-[20%] w-64 h-64 rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, var(--rocket-purple) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute bottom-[40%] left-[15%] w-48 h-48 rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, #38bdf8 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />
      </motion.div>

      {/* Layer 3 - Close shapes (floating orbs) */}
      <motion.div
        style={{ x: layer3X, y: layer3Y }}
        className="absolute inset-0"
      >
        {/* Animated orbs */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[15%] right-[30%] w-4 h-4 rounded-full bg-[var(--rocket-purple)] opacity-40 blur-sm"
        />
        <motion.div
          animate={{
            y: [0, 15, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute top-[60%] left-[20%] w-3 h-3 rounded-full bg-[var(--rocket-green)] opacity-50 blur-sm"
        />
        <motion.div
          animate={{
            y: [0, -10, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute top-[40%] right-[15%] w-2 h-2 rounded-full bg-[#38bdf8] opacity-60 blur-sm"
        />
      </motion.div>

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(130, 87, 229, 0.1) 0%, transparent 50%)",
        }}
      />

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#13131b] to-transparent" />
    </div>
  );
}

