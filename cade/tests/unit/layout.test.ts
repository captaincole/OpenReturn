/*
 * Every test lives under tests/ (see tests/README.md). Vitest would run
 * a test file anywhere, so this check keeps them out of src/ and scripts/.
 */

import { readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const AGENT_ROOT = resolve(__dirname, "../..");

function testFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return testFiles(full);
    return /\.test\.tsx?$/.test(entry.name) ? [relative(AGENT_ROOT, full)] : [];
  });
}

describe("test layout", () => {
  it.each(["src", "scripts"])("%s/ has no test files", (dir) => {
    expect(testFiles(join(AGENT_ROOT, dir))).toEqual([]);
  });
});
