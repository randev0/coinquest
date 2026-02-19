import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/coinquest",
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
