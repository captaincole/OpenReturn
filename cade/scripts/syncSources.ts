/*
 * Copy every blank.pdf into src/mastra/public/sources/ (gitignored), which Mastra
 * ships with the server. Runs before `dev`, `build` and the e2e agent.
 */

import { SOURCES_ROOT } from "@openreturn/sources";
import { copyFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const RUNTIME_DIR = resolve(__dirname, "../src/mastra/public/sources");

const RUNTIME_FILES = new Set(["blank.pdf"]);

function runtimeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return runtimeFiles(full);
    return RUNTIME_FILES.has(entry.name) ? [full] : [];
  });
}

rmSync(RUNTIME_DIR, { recursive: true, force: true });
const files = runtimeFiles(SOURCES_ROOT);
for (const file of files) {
  const target = join(RUNTIME_DIR, relative(SOURCES_ROOT, file));
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(file, target);
}
console.log(`[sources:sync] ${files.length} files → ${relative(process.cwd(), RUNTIME_DIR)}`);
