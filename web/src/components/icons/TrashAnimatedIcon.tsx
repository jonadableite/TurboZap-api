"use client";

import { LottieIcon } from "@/components/ui";
import { recolorLottiePalette } from "@/lib/lottie/recolor";
import { useMemo } from "react";
import trashAnimation from "../../../public/lixeira.json";

type Props = {
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
};

/**
 * Animated trash/delete icon (lixeira).
 * Default color: Rocket danger (#f75a68).
 */
export function TrashAnimatedIcon({
  className = "w-5 h-5",
  loop = true,
  autoplay = true,
}: Props) {
  const animationData = useMemo(
    () =>
      recolorLottiePalette(trashAnimation, {
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


