import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /* Next.js otherwise picks the outermost lockfile as the root, and warns. */
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    /* The dev cache served stale globals.css after a restart. Off keeps CSS current. */
    turbopackFileSystemCacheForDev: false,
  },
  /* Next 16.4 writes AGENTS.md for coding agents; CLAUDE.md has the rules. */
  agentRules: false,
  /* Bottom-left covers the chat composer's attach button. */
  devIndicators: {
    position: "bottom-right",
  },
  /* LAN devices (phone) get 403 on /_next/* and HMR unless listed in DEV_ALLOWED_ORIGINS. */
  allowedDevOrigins: (process.env.DEV_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  /* nosniff: an upload cannot turn into a page. The page CSP is per request, in proxy.ts. */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
