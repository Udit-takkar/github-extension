import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['postgres', 'drizzle-orm']
  }
};

export default nextConfig;
