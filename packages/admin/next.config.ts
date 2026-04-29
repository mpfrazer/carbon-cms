import type { NextConfig } from "next";

// Derive protocol/hostname/port from CARBON_API_URL so the Image component
// can fetch locally-served uploads through Next.js image optimization.
// In dev this is http://localhost:3001; in Docker it may be http://api:3001.
const apiUrl = new URL(process.env.CARBON_API_URL ?? "http://localhost:3001");
const apiPattern = {
  protocol: apiUrl.protocol.slice(0, -1) as "http" | "https",
  hostname: apiUrl.hostname,
  ...(apiUrl.port ? { port: apiUrl.port } : {}),
};

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**" },
      apiPattern,
    ],
  },
};

export default nextConfig;
