/* The runner sets E2E_RUN_ID once; Playwright workers inherit it and agree on the folder. */

import { resolve } from "node:path";

process.env.E2E_RUN_ID ??= new Date().toISOString().replace(/[:.]/g, "-");

export const RUN_DIR = resolve(__dirname, ".run", process.env.E2E_RUN_ID);

const DATA_DIR = resolve(RUN_DIR, "data");

/*
 * Cade believes the web app's user header only from a caller with this token,
 * so the run sets one: every turn goes the way a shared instance's turn goes.
 */
export const AGENT_TOKEN = "e2e-agent-token";
export const AGENT_URL = "http://127.0.0.1:4111";

export const DATA_ENV = {
  APP_DB_PATH: resolve(DATA_DIR, "app.db"),
  MASTRA_DB_PATH: resolve(DATA_DIR, "mastra.db"),
  DOCUMENTS_PATH: resolve(DATA_DIR, "documents"),
};

/*
 * The stand-in for Cloudflare Access that access.spec.ts starts (fakeAccess.ts).
 * The web server gets these in every run; they do nothing until AUTH_MODE is
 * cloudflare-access, which `npm run e2e:access` sets.
 */
export const ACCESS_ISSUER_PORT = 4199;
export const ACCESS_TEAM_DOMAIN = `http://127.0.0.1:${ACCESS_ISSUER_PORT}`;
export const ACCESS_AUD = "e2e-access-application";
