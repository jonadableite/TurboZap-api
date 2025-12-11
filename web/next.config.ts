import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: "standalone",
  experimental: {
    turbo: {
      // Fix Turbopack root detection when multiple lockfiles exist
      root: __dirname,
    },
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
