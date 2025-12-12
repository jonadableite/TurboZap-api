import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: "standalone",
  // Next.js 16+: Turbopack config is top-level (was `experimental.turbo` / `experimental.turbopack` in older versions)
  turbopack: {
    // Fix Turbopack root detection when multiple lockfiles exist
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pps.whatsapp.net",
      },
    ],
  },
};

export default nextConfig;
