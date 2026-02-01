// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🔥 This line prevents Vercel Turbopack crash
  turbopack: {},

  webpack: (config) => {
    // Required for ffmpeg.wasm
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Prevent "fs" errors in browser build
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    return config;
  },

  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
