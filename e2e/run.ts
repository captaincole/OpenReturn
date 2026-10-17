/*
 * Paths for one E2E run. Each run writes to its own folder,
 * e2e/.run/<runId>/: data files, server logs, test output, and the chat
 * transcript. The runner process sets E2E_RUN_ID once; Playwright
 * workers inherit it, so every process agrees on the folder.
 */

import { resolve } from "node:path";

process.env.E2E_RUN_ID ??= new Date().toISOString().replace(/[:.]/g, "-");

export const RUN_DIR = resolve(__dirname, ".run", process.env.E2E_RUN_ID);

const DATA_DIR = resolve(RUN_DIR, "data");

/* The data-path env vars both apps read, pointed at this run's folder. */
export const DATA_ENV = {
  APP_DB_PATH: resolve(DATA_DIR, "app.db"),
  MASTRA_DB_PATH: resolve(DATA_DIR, "mastra.db"),
  DOCUMENTS_PATH: resolve(DATA_DIR, "documents"),
};
