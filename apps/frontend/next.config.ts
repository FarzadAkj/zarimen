import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The shared workspace package ships TypeScript source.
  transpilePackages: ["@zar-imen/shared"],
};

export default nextConfig;
