import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /*
   * Pin the workspace root to this app. Next.js otherwise picks the
   * outermost lockfile (the one in ~/attain-finance/) and warns. This app
   * is a self-contained deploy unit, so anchor here.
   */
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    /*
     * Off: with the dev filesystem cache (on by default since Next 16.1),
     * a restart served a globals.css chunk from before edits made while
     * the server was stopped, so new Tailwind/CSS rules never reached the
     * page. A cold start is slower, but CSS is always current.
     */
    turbopackFileSystemCacheForDev: false,
  },
  /*
   * The dev-tools FAB defaults to bottom-left. There it covers the chat
   * composer's attach button.
   */
  devIndicators: {
    position: "bottom-right",
  },
  /*
   * Hosts that can reach dev internals (/_next/*, HMR websocket) from
   * another device on the LAN. Next 16 returns 403 to them otherwise.
   * Set DEV_ALLOWED_ORIGINS in .env.development (comma-separated).
   */
  allowedDevOrigins: (process.env.DEV_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  /*
   * On every response: no MIME sniffing (an upload cannot turn into a
   * page), no framing (clickjacking), no Referer to other sites. The page
   * CSP is per request, in proxy.ts.
   */
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
