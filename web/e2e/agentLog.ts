/*
 * With these errors the web app shows an empty reply. That looks like a model
 * mistake but is a broken app (missing API key, wrong model URL).
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { RUN_DIR } from "./run";

const AGENT_ERRORS = ['"msg":"Error in agent stream"', '"msg":"Upstream LLM API error"'];

export function agentStreamErrors(): string[] {
  const file = join(RUN_DIR, "agent.log");
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => AGENT_ERRORS.some((msg) => line.includes(msg)))
    .map((line) => {
      try {
        return (JSON.parse(line) as { error?: { message?: string } }).error?.message ?? line;
      } catch {
        return line.slice(0, 300);
      }
    });
}
