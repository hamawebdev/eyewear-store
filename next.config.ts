import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Skip linting & type-checking during production builds (already validated locally / in CI)
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "example.com",
      },
    ],
  },
  experimental: {
    // Reduce webpack memory footprint — critical for Payload admin bundling
    webpackMemoryOptimizations: true,
  },
  webpack: (config) => {
    // Allow resolving .js extensions to .ts files for ESM compatibility
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };
    return config;
  }
};


export default withPayload(nextConfig);
