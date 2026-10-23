/*
 * Canon is the library, not the tax return. Nothing under src/ or
 * scripts/ may reach into Cade (apps/agent, app.db, ask threads), the
 * form engine, or agent memory. The MCP server is the only way out; the
 * corpus is the only thing in.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const CANON_ROOT = resolve(__dirname, "../..");

const FORBIDDEN: { pattern: RegExp; why: string }[] = [
  { pattern: /from ["'][^"']*apps\/agent/, why: "Cade's code" },
  {
    pattern: /from ["'][^"']*\/(appDb|askThreads|taxFacts|aiDecisions|filings)["']/,
    why: "app.db",
  },
  { pattern: /from ["']@openreturn\/engine/, why: "the form engine" },
  { pattern: /from ["']@mastra\/memory/, why: "agent memory (Canon is not conversational)" },
  { pattern: /\bAPP_DB_PATH\b/, why: "app.db" },
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith(".ts") ? [full] : [];
  });
}

describe("canon boundary", () => {
  const files = [
    ...sourceFiles(join(CANON_ROOT, "src")),
    ...sourceFiles(join(CANON_ROOT, "scripts")),
  ];

  it("has source files to check", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(FORBIDDEN)("never imports $why", ({ pattern }) => {
    const offenders = files.filter((f) => pattern.test(readFileSync(f, "utf8")));
    expect(offenders.map((f) => relative(CANON_ROOT, f))).toEqual([]);
  });
});
