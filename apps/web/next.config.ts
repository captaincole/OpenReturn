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
   */
  allowedDevOrigins: ["192.168.1.20", "my-laptop.local"],
};

export default nextConfig;
