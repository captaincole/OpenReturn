/*
 * The engine boundary, enforced mechanically.
 *
 * The form engine is a pure library: fact/decision rows in, evaluated
 * forms out. It must never import application code: no Mastra, no db
 * layer, no AI, no network clients. This test walks every module under
 * src/ and fails on any import that escapes the directory, so the
 * boundary survives contributors who never read a README.
 *
 * Allowed imports:
 *   - anything inside src/
 *   - node builtins (node:*)
 *   - a short whitelist of pure libraries (zod, pdf-lib)
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

/** Collect static, side-effect, re-export, and dynamic import specifiers. */
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
