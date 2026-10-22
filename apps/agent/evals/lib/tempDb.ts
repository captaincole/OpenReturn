import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/*
 * Import this module FIRST: it points app.db and mastra.db at a throwaway
 * folder before any module opens them, so an eval never touches .data/.
 */
const dir = mkdtempSync(path.join(tmpdir(), "openreturn-eval-"));
process.env.APP_DB_PATH = path.join(dir, "app.db");
process.env.MASTRA_DB_PATH = path.join(dir, "mastra.db");
