"use client";

import { Badge, LottieIcon } from "@/components/ui";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  BarChart3,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import incendioAnimation from "../../../public/incendio.json";

export interface ActivityCardProps {
  id: string;
  title: string;
  description?: string;
  date: string; // Format: "11 DEZ" or "01 - 10 DEZ"
  time?: string; // Format: "10:00"
  location?: string;
  tags?: string[];
  recommendedLevel?: string; // Format: "B2 - C2..." or "A1 - B1..."
  status?: "active" | "finished" | "upcoming";
  actionButtons?: {
    primary?: { label: string; href?: string; onClick?: () => void };
    secondary?: { label: string; href?: string; onClick?: () => void };
  };
  className?: string;
}

// Helper to parse date string and extract day, month
function parseDate(dateStr: string): { day: string; month: string } {
  // Handle formats like "11 DEZ" or "01 - 10 DEZ" or "11 DE DEZ"
  const parts = dateStr.trim().split(" ").filter(p => p);
  
  if (parts.length >= 2) {
    // Get the first number (day)
    const day = parts[0];
    // Get the last part which should be the month
    const month = parts[parts.length - 1];
    return { day, month };
  }
  
  // Fallback: try to extract from formats like "11 DE DEZ"
  const match = dateStr.match(/(\d+)\s+(?:DE\s+)?([A-Z]+)/);
  if (match) {
    return { day: match[1], month: match[2] };
  }
  
  return { day: "", month: "" };
}

// Helper to get tag icon
function getTagIcon(tag: string) {
  const lowerTag = tag.toLowerCase();
  if (lowerTag.includes("intermediário") || lowerTag.includes("iniciante") || lowerTag.includes("avançado")) {
    return <BarChart3 className="w-3 h-3 text-[var(--rocket-green)]" />;
  }
  if (lowerTag.includes("carreira") || lowerTag.includes("career")) {
    return <Briefcase className="w-3 h-3 text-[var(--rocket-purple)]" />;
  }
  return null;
}

export function ActivityCard({
  title,
  description,
  date,
  time,
  location,
  tags = [],
  recommendedLevel,
  status = "active",
  actionButtons,
  className,
}: ActivityCardProps) {
  const isFinished = status === "finished";
  const { day, month } = parseDate(date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl bg-[#1a1a24] border border-[#29292e] p-0 hover:border-[#29292e]/80 transition-all group relative overflow-hidden",
        isFinished && "opacity-60",
        className
      )}
    >
      {/* Purple vertical border on the left */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--rocket-purple)]" />

      <div className="flex gap-0 min-h-[120px] sm:min-h-[140px]">
        {/* Left Section - Date and Time */}
        <div className="flex-shrink-0 flex flex-col items-start justify-center pl-8 sm:pl-[47px]">
          <div className="text-xl sm:text-2xl font-bold text-white leading-none mb-1">
            {day}
          </div>
          <div className="text-[10px] sm:text-xs text-white mb-1 sm:mb-2">{month}</div>
          {time && (
            <div className="text-[10px] sm:text-xs text-white">{time}</div>
          )}
        </div>

        {/* Right Section - Event Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-center pr-4 sm:pr-5 pl-6 sm:pl-[43px] py-4 sm:py-5">
          {/* Location */}
          {location && (
            <p className="text-xs text-[var(--rocket-gray-400)] mb-2">
              {location}
            </p>
          )}

          {/* Title with icon */}
          <div className="flex items-start gap-2 mb-2">
            <div className="flex-shrink-0 mt-0.5 w-4 h-4">
              <LottieIcon 
                animationData={incendioAnimation} 
                className="w-4 h-4" 
              />
            </div>
            <h3 className="text-sm font-semibold text-[var(--rocket-gray-50)] leading-tight">
              {title}
            </h3>
          </div>

          {/* Recommended Level */}
          {recommendedLevel && (
            <p className="text-xs text-[var(--rocket-gray-400)] mb-3">
              • Recomendado: {recommendedLevel}
            </p>
          )}

          {/* Description */}
          {description && (
            <p className="text-xs text-[var(--rocket-gray-300)] mb-3 line-clamp-2">
              {description}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag, index) => {
                const icon = getTagIcon(tag);
                return (
                  <Badge
                    key={index}
                    variant="default"
                    className="text-[10px] px-2 py-0.5 h-5 flex items-center gap-1 bg-[#29292e] text-[var(--rocket-gray-300)] border border-[#29292e] rounded-full"
                    icon={icon}
                  >
                    {tag}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          {actionButtons && !isFinished && (
            <div className="flex flex-wrap gap-2">
              {actionButtons.primary && (
                <button
                  onClick={actionButtons.primary.onClick}
                  className="text-xs px-3 py-1.5 rounded-md bg-[var(--rocket-purple)] text-white hover:bg-[var(--rocket-purple)]/80 transition-colors"
                >
                  {actionButtons.primary.label}
                </button>
              )}
              {actionButtons.secondary && (
                <button
                  onClick={actionButtons.secondary.onClick}
                  className="text-xs px-3 py-1.5 rounded-md border border-[#29292e] text-[var(--rocket-gray-300)] hover:bg-[#29292e] transition-colors flex items-center gap-1"
                >
                  {actionButtons.secondary.label}
                </button>
              )}
            </div>
          )}

          {/* Finished Badge */}
          {isFinished && (
            <Badge
              variant="default"
              className="text-[10px] px-2 py-0.5 bg-[#29292e] text-[var(--rocket-gray-400)] border border-[#29292e]"
            >
              FINALIZADO
            </Badge>
          )}
        </div>

        {/* Chevron Right */}
        <div className="hidden sm:flex items-center justify-center w-8 flex-shrink-0 pr-4">
          <ChevronRight className="w-4 h-4 text-[var(--rocket-gray-400)] group-hover:text-[var(--rocket-gray-300)] transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}
