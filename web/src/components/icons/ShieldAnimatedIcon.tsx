"use client";

import { LottieIcon } from "@/components/ui";
import { recolorLottiePalette } from "@/lib/lottie/recolor";
import { useMemo } from "react";
import shieldAnimation from "../../../public/escudo.json";

type Props = {
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
};

/**
 * Animated shield icon (escudo).
 * Default color: Rocket primary (#8257e5).
 */
export function ShieldAnimatedIcon({
  className = "w-5 h-5",
  loop = true,
  autoplay = true,
}: Props) {
  const animationData = useMemo(
    () =>
      recolorLottiePalette(shieldAnimation, {
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


