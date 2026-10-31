/*
 * Imported before ../lib/models, which reads the env when it loads: the eval
 * settings (EVAL_PC_OLLAMA_URL, ANTHROPIC_API_KEY) live in cade's env files.
 */
import { config } from "dotenv";
import path from "node:path";

const CADE = path.resolve(__dirname, "../..");
config({ path: path.join(CADE, ".env"), quiet: true });
config({ path: path.join(CADE, ".env.development"), quiet: true });
