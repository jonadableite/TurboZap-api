"use client";

import { LottieIcon } from "@/components/ui";
import { recolorLottiePalette } from "@/lib/lottie/recolor";
import { useMemo } from "react";
import avisoAnimation from "../../../public/aviso.json";

type Props = {
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
};

/**
 * Animated warning/alert icon (aviso).
 * Default color: Rocket warning (#fba94c).
 */
export function WarningAnimatedIcon({
  className = "w-5 h-5",
  loop = true,
  autoplay = true,
}: Props) {
  const animationData = useMemo(
    () =>
      recolorLottiePalette(avisoAnimation, {
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


