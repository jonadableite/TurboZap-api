"use client";

import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Lottie
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

interface LottieIconProps {
  animationData: object;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}

export function LottieIcon({ 
  animationData, 
  className = "w-5 h-5", 
  loop = true, 
  autoplay = true 
}: LottieIconProps) {
  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      className={className}
    />
  );
}

