"use client";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Gift,
  ShoppingBag,
  Users,
} from "lucide-react";
import { useState } from "react";

interface BoostDay {
  day: number;
  hasBoost: boolean;
  isToday: boolean;
}

export function DashboardSidebar() {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  // Mock data - em produção viria de um hook/API
  const goal = {
    text: "Aprimorar minhas habilidades em programação",
    deadline: "25/05/2026",
    progress: 58,
  };

  const boosts = {
    current: 4,
    total: 6,
    days: [
      { day: 7, hasBoost: true, isToday: false },
      { day: 8, hasBoost: true, isToday: false },
      { day: 9, hasBoost: true, isToday: false },
      { day: 10, hasBoost: true, isToday: true },
      { day: 11, hasBoost: false, isToday: false },
      { day: 12, hasBoost: false, isToday: false },
      { day: 13, hasBoost: false, isToday: false },
    ] as BoostDay[],
  };

  const ads = [
    {
      id: 1,
      title: "30% OFF NA PÓS-GRADUAÇÃO",
      subtitle: "CYBER WEEK",
      brand: "Faculdade de Tecnologia Rocketseat",
      image: "/bg_white-removebg-preview.png", // Placeholder - usar imagem real
    },
  ];

  const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <div className="w-full lg:w-80 space-y-6">
      {/* Goal Card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl bg-[#1a1a24] border border-[#29292e] p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag className="w-4 h-4 text-[var(--rocket-purple)]" />
          <h3 className="text-sm font-semibold text-[var(--rocket-gray-50)]">
            Meu objetivo
          </h3>
        </div>
        <p className="text-xs text-[var(--rocket-gray-300)] mb-3 line-clamp-2">
          {goal.text}
        </p>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--rocket-gray-400)]">
            até {goal.deadline}
          </span>
          <span className="text-xs font-medium text-[var(--rocket-purple)]">
            {goal.progress}%
          </span>
        </div>
        <div className="h-2 bg-[#29292e] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goal.progress}%` }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="h-full bg-gradient-to-r from-[var(--rocket-purple)] to-[var(--rocket-purple)]/70 rounded-full"
          />
        </div>
      </motion.div>

      {/* Boosts Card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl bg-[#1a1a24] border border-[#29292e] p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--rocket-gray-50)]">
            Meus boosts
          </h3>
          <span className="text-xs text-[var(--rocket-gray-400)]">
            {boosts.current} / {boosts.total}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className="text-center text-xs text-[var(--rocket-gray-400)]"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {boosts.days.map((boostDay, index) => (
            <div
              key={index}
              className={cn(
                "aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all",
                boostDay.isToday
                  ? "bg-[var(--rocket-purple)]/20 border-2 border-[var(--rocket-purple)] text-[var(--rocket-purple)]"
                  : boostDay.hasBoost
                  ? "bg-[var(--rocket-orange)]/10 text-[var(--rocket-orange)]"
                  : "bg-[#29292e] text-[var(--rocket-gray-400)]"
              )}
            >
              {boostDay.hasBoost && !boostDay.isToday && (
                <span className="text-[10px]">🔥</span>
              )}
              {boostDay.isToday ? (
                <span className="text-[10px]">{boostDay.day}</span>
              ) : (
                <span>{boostDay.day}</span>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <Button
          variant="primary"
          className="w-full justify-start"
          leftIcon={<Gift className="w-4 h-4" />}
        >
          Indique e ganhe
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          leftIcon={<Users className="w-4 h-4" />}
          onClick={() => {
            window.open("https://chat.whatsapp.com/FBGwMYACSqjBQnIXZqZMdy", "_blank", "noopener,noreferrer");
          }}
        >
          Comunidade
        </Button>
      </motion.div>

      {/* Ad Carousel */}
      {ads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl bg-[#1a1a24] border border-[#29292e] overflow-hidden relative"
        >
          <div className="relative h-48 bg-gradient-to-br from-[var(--rocket-purple)]/20 to-[var(--rocket-purple)]/10">
            {ads[currentAdIndex] && (
              <>
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[var(--rocket-purple)] mb-1">
                      {ads[currentAdIndex].subtitle}
                    </p>
                    <h4 className="text-sm font-bold text-[var(--rocket-gray-50)] mb-2">
                      {ads[currentAdIndex].title}
                    </h4>
                    <p className="text-[10px] text-[var(--rocket-gray-400)]">
                      {ads[currentAdIndex].brand}
                    </p>
                  </div>
                </div>
                {ads.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentAdIndex(
                          (prev) => (prev - 1 + ads.length) % ads.length
                        )
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentAdIndex((prev) => (prev + 1) % ads.length)
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          {ads.length > 1 && (
            <div className="flex items-center justify-center gap-1 p-2">
              {ads.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentAdIndex(index)}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    index === currentAdIndex
                      ? "bg-[var(--rocket-purple)] w-4"
                      : "bg-[var(--rocket-gray-600)]"
                  )}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}


