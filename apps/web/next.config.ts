import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow accessing the dev server via 127.0.0.1 (not just localhost).
  // Without this, HMR / RSC fetches are blocked and React event handlers
  // never attach — clicks silently no-op.
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.1.7"],
};

export default nextConfig;
