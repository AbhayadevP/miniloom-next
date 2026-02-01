// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Webpack configuration for ffmpeg.wasm
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Enable WebAssembly support
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };
    }

    // Prevent "fs" module errors in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    return config;
  },

  // CORS headers for uploaded videos
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;