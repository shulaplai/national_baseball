import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 Cache Components：用 'use cache' + cacheLife 管理數據快取
  cacheComponents: true,
  // MLB 官方球員頭像
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.mlbstatic.com",
      },
    ],
  },
};

export default nextConfig;
