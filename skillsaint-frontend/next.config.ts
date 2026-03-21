import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      // Force Turbopack to use the project root directory
      // This solves the 'Next.js inferred your workspace root, but it may not be correct' error
      root: ".", 
    },
  },
};

export default nextConfig;
