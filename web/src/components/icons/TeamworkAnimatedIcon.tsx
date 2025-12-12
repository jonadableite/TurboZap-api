"use client";

import { LottieIcon } from "@/components/ui";
import { recolorLottiePalette } from "@/lib/lottie/recolor";
import { useMemo } from "react";
import teamworkAnimation from "../../../public/trabalho-em-equipe.json";

type Props = {
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
};

/**
 * Animated icon for "Usuários" (teamwork).
 * Recolored to Rocket primary: --rocket-purple (#8257e5).
 */
export function TeamworkAnimatedIcon({
  className = "w-5 h-5",
  loop = true,
  autoplay = true,
}: Props) {
  const animationData = useMemo(
    () =>
      recolorLottiePalette(teamworkAnimation, {
        accentHex: "#8257e5",
        neutralHex: "#7c7c8a",
      }) as object,
    []
  );

  return (
    <LottieIcon
      animationData={animationData}
      className={className}
      loop={loop}
      autoplay={autoplay}
    />
  );
}
