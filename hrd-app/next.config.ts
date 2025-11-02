import type { NextConfig } from "next";
import withPWA from "next-pwa";

const withPWAConfigured = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
});

const baseConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Don't block production builds on ESLint errors
    ignoreDuringBuilds: true,
  },
};

export default withPWAConfigured(baseConfig);
