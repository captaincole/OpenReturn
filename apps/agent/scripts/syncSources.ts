/*
 * Copy every blank.pdf (the engine fills it) from @summa/sources into
 * the agent's runtime tree, src/mastra/public/sources/, with the same
 * layout (<year>/forms/<relativeDir>/blank.pdf). Instruction and
 * publication PDFs are not copied: the reference library serves them
 * from corpus.db. Mastra ships public/ with the server, and
 * src/mastra/formAssets.ts reads from it. The tree is gitignored:
 * @summa/sources is the one copy in git. Runs before `dev` and `build`
 * (npm pre-scripts) and before the e2e agent.
 */

import { SOURCES_ROOT } from "@summa/sources";
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
