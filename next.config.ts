import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mark Stacks packages as external during server compilation
  // to avoid Turbopack module resolution issues with browser-only code
  serverExternalPackages: ["@stacks/connect", "@stacks/transactions"],
};

export default nextConfig;


