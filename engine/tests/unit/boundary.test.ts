/*
 * The engine is a pure library. src/ may import only src/, node builtins, and
 * pure libraries (zod, pdf-lib): no Mastra, db, AI, or network clients.
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

const ENGINE_ROOT = resolve(__dirname, "../../src");

const ALLOWED_PACKAGES = new Set(["zod", "pdf-lib"]);

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith(".ts") ? [full] : [];
  });
}

function importSpecifiers(source: string): string[] {
  const specs: string[] = [];
  const patterns = [
    /(?:import|export)\s[^"']*?from\s*["']([^"']+)["']/g,
    /import\s*["']([^"']+)["']/g,
    /import\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const re of patterns) {
    for (const m of source.matchAll(re)) specs.push(m[1]);
  }
  return specs;
}

describe("engine boundary", () => {
  const files = walk(ENGINE_ROOT);

  it("finds engine modules to check", () => {
    expect(files.length).toBeGreaterThan(30);
  });

  for (const file of files) {
    const rel = file.slice(ENGINE_ROOT.length + 1);
    it(`${rel} imports nothing outside src/`, () => {
      const violations: string[] = [];
      for (const spec of importSpecifiers(readFileSync(file, "utf8"))) {
        if (spec.startsWith("node:")) continue;
        if (spec.startsWith(".")) {
          const target = resolve(dirname(file), spec);
          const inside = target === ENGINE_ROOT || target.startsWith(ENGINE_ROOT + sep);
          if (!inside) violations.push(spec);
        } else {
          const pkg = spec.startsWith("@")
            ? spec.split("/").slice(0, 2).join("/")
            : spec.split("/")[0];
          if (!ALLOWED_PACKAGES.has(pkg)) violations.push(spec);
        }
      }
      expect(violations, `boundary violations in ${rel}`).toEqual([]);
    });
  }
});
