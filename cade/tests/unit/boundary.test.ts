/*
 * Cade reaches Canon over MCP only (src/mastra/canon/client.ts).
 * It never imports Canon's code or opens the corpus.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const AGENT_ROOT = resolve(__dirname, "../..");

const FORBIDDEN: { pattern: RegExp; why: string }[] = [
  { pattern: /from ["']@openreturn\/canon/, why: "Canon's package" },
  { pattern: /import\(["']@openreturn\/canon/, why: "Canon's package (dynamic)" },
  { pattern: /from ["'][^"']*\/canon\/src\//, why: "Canon's source" },
  { pattern: /\bCORPUS_DB_PATH\b/, why: "corpus.db" },
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith(".ts") ? [full] : [];
  });
}

describe("cade boundary", () => {
  const files = ["src", "scripts", "evals"].flatMap((dir) => sourceFiles(join(AGENT_ROOT, dir)));

  it("has source files to check", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(FORBIDDEN)("never imports $why", ({ pattern }) => {
    const offenders = files.filter((file) => pattern.test(readFileSync(file, "utf8")));
    expect(offenders.map((offender) => relative(AGENT_ROOT, offender))).toEqual([]);
  });
});
