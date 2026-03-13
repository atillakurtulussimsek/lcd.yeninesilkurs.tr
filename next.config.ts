import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: false, // Avoid double-mounting in dev that disrupts playback
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lcd-cdn.yeninesilkurs.tr",
      },
    ],
  },
};

export default nextConfig;
