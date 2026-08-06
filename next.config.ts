import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 Cache Components：用 'use cache' + cacheLife 管理數據快取
  cacheComponents: true,
};

export default nextConfig;
