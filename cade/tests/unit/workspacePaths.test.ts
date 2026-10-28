/*
 * Without the tsconfig alias, mastra dev leaves @openreturn/engine external, and
 * plain Node cannot load its TypeScript. Keep the alias equal to the `exports` maps.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const AGENT_ROOT = resolve(__dirname, "../..");
const readJson = (path: string) => JSON.parse(readFileSync(resolve(AGENT_ROOT, path), "utf8"));

function exportsAsPaths(pkgDir: string): Record<string, string[]> {
  const pkg = readJson(`${pkgDir}/package.json`) as {
    name: string;
    exports: Record<string, string>;
  };
  return Object.fromEntries(
    Object.entries(pkg.exports).map(([sub, file]) => [
      sub === "." ? pkg.name : `${pkg.name}/${sub.slice(2)}`,
      [`${pkgDir}/${file.slice(2)}`],
    ]),
  );
}

describe("workspace path aliases", () => {
  it("match the engine and sources package exports", () => {
    const { paths } = readJson("tsconfig.json").compilerOptions as {
      paths: Record<string, string[]>;
    };
    expect(paths).toEqual({
      ...exportsAsPaths("../engine"),
      ...exportsAsPaths("../sources"),
    });
  });
});
