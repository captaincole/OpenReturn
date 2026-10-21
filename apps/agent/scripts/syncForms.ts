/*
 * Copy every blank.pdf (the engine fills it) and every instructions.pdf
 * plus its instructions.meta.json sidecar (the reference library serves
 * it) from @summa/forms into the agent's runtime tree,
 * src/mastra/public/forms/<year>/<relativeDir>/. Mastra ships public/
 * with the server, and src/mastra/formAssets.ts reads from it.
 * The tree is gitignored: @summa/forms is the one copy in git. Runs
 * before `dev` and `build` (npm pre-scripts) and before the e2e agent.
 */

import { FORMS_ROOT } from "@summa/forms";
import { copyFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const RUNTIME_DIR = resolve(__dirname, "../src/mastra/public/forms");

const RUNTIME_FILES = new Set(["blank.pdf", "instructions.pdf", "instructions.meta.json"]);

function runtimeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return runtimeFiles(full);
    return RUNTIME_FILES.has(entry.name) ? [full] : [];
  });
}

rmSync(RUNTIME_DIR, { recursive: true, force: true });
const files = runtimeFiles(FORMS_ROOT);
for (const file of files) {
  const target = join(RUNTIME_DIR, relative(FORMS_ROOT, file));
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(file, target);
}
console.log(`[forms:sync] ${files.length} files → ${relative(process.cwd(), RUNTIME_DIR)}`);
