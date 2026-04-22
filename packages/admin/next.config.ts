import type { NextConfig } from "next";

const apiUrl = process.env.CARBON_API_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiUrl}/api/v1/:path*`,
      },
      {
        source: "/api/auth/:path*",
        destination: `/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
