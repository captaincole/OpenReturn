/*
 * Errors the agent logged while it ran a turn: one JSON line per error,
 * with one of the messages below. The web app then shows an empty reply,
 * which looks like a model mistake but is a broken app (for example a
 * missing API key or a wrong model URL).
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
