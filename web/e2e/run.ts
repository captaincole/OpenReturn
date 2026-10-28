/* The runner sets E2E_RUN_ID once; Playwright workers inherit it and agree on the folder. */

import { resolve } from "node:path";

process.env.E2E_RUN_ID ??= new Date().toISOString().replace(/[:.]/g, "-");

export const RUN_DIR = resolve(__dirname, ".run", process.env.E2E_RUN_ID);

const DATA_DIR = resolve(RUN_DIR, "data");

export const DATA_ENV = {
  APP_DB_PATH: resolve(DATA_DIR, "app.db"),
  MASTRA_DB_PATH: resolve(DATA_DIR, "mastra.db"),
  DOCUMENTS_PATH: resolve(DATA_DIR, "documents"),
};
