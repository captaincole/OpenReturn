/*
 * End-to-end tests: the real web app + agent + local model, driven
 * through Chrome. Run with `npm run e2e` (stop `npm run dev:all` first).
 *
 * The run owns the normal ports (:4111 agent, :3000 web) but a throwaway
 * data folder (run.ts). `reuseExistingServer: false` makes the run fail
 * when dev:all is up, so a test can never write into your real app.db.
 */

import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";
import { DATA_ENV, RUN_DIR } from "./run";

const SERVER_START_MS = 5 * 60_000; // mastra dev bundles on first start

const serverEnv = {
  ...(process.env as Record<string, string>),
  ...DATA_ENV,
  E2E_RUN_DIR: RUN_DIR,
};

const server = (name: "canon" | "agent" | "web", url: string) => ({
  name,
  command: `node ${resolve(__dirname, "servers.mjs")} ${name}`,
  url,
  env: serverEnv,
  reuseExistingServer: false,
  timeout: SERVER_START_MS,
  gracefulShutdown: { signal: "SIGTERM" as const, timeout: 5_000 },
});

export default defineConfig({
  testDir: ".",
  outputDir: resolve(RUN_DIR, "test-results"),
  reporter: [["list"], ["html", { outputFolder: resolve(RUN_DIR, "report"), open: "never" }]],
  workers: 1,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    channel: "chrome",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    server("canon", "http://127.0.0.1:4112/health"),
    server("agent", "http://127.0.0.1:4111/health"),
    server("web", "http://localhost:3000/login"),
  ],
});
