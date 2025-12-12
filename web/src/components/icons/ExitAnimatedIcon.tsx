"use client";

import { LottieIcon } from "@/components/ui";
import { recolorLottiePalette } from "@/lib/lottie/recolor";
import { useMemo } from "react";
import exitAnimation from "../../../public/sair.json";

type Props = {
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
};

/**
 * Animated logout/exit icon (sair).
 * Default color: Rocket gray-300 (#8d8d99).
 */
export function ExitAnimatedIcon({
  className = "w-5 h-5",
  loop = true,
  autoplay = true,
}: Props) {
  const animationData = useMemo(
    () =>
      recolorLottiePalette(exitAnimation, {
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


