// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    // Prefer modern formats; Next will auto-negotiate with the browser
    formats: ["image/avif", "image/webp"],
    // Sensible responsive breakpoints for your gallery
    deviceSizes: [640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [320, 480, 640, 750, 828, 1080, 1200],
    // Long CDN cache for generated variants
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },
};

export default nextConfig;
