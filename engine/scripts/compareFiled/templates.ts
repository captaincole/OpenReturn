/*
 * --init: copy the jordan scenario into the data folder as a template.
 * Never overwrites a file.
 *
 * The copies hold jordan's FAKE values in the normal scenario format
 * (facts.ts, decisions.ts, expected.ts, index.ts). The taxpayer replaces
 * every value with their own; expected.ts holds the filed return.
 * AI_PROMPT.md is copied with the real folder and repo paths filled in.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const ENGINE_ROOT = process.cwd();
const JORDAN_DIR = resolve(ENGINE_ROOT, "tests/scenarios/jordan");

const COPY_HEADER = `/*
 * TEMPLATE — copied from the jordan scenario (FAKE values).
 * Replace every value with your own before you compare.
 */

`;

/* Re-point the scenario's relative imports at the repo. */
function copyJordan(file: string, engineRel: string): string {
  /* Drop the file's own header (jordan's expected.ts says "generated, do not edit"). */
  const src = readFileSync(resolve(JORDAN_DIR, file), "utf8").replace(/^\/\*[\s\S]*?\*\/\n+/, "");
  return (
    COPY_HEADER +
    src
      .replaceAll('"../../../src/', `"${engineRel}/src/`)
      .replaceAll('"../../helpers/', `"${engineRel}/tests/helpers/`)
      .replaceAll('"../../types.js"', `"${engineRel}/tests/types.js"`)
  );
}

/* Who prepared the filed return. The report prints it next to the results. */
const PREPARER_HINT =
  '// preparer: { kind: "software", name: "<software and version>" }, // or "cpa" | "enrolled_agent" | "self"';

function writeOnce(path: string, make: () => string): void {
  if (existsSync(path)) {
    console.log(`kept    ${path}`);
    return;
  }
  writeFileSync(path, make());
  console.log(`wrote   ${path}`);
}

export function writeTemplates(dir: string): void {
  mkdirSync(dir, { recursive: true });
  const engineRel = relative(dir, ENGINE_ROOT);
  writeOnce(resolve(dir, "AI_PROMPT.md"), () =>
    readFileSync(resolve(ENGINE_ROOT, "scripts/compareFiled/AI_PROMPT.md"), "utf8")
      .replaceAll("{{FOLDER}}", dir)
      .replaceAll("{{ENGINE}}", ENGINE_ROOT),
  );
  for (const name of readdirSync(JORDAN_DIR).filter((f) => f.endsWith(".ts"))) {
    writeOnce(resolve(dir, name), () => {
      const text = copyJordan(name, engineRel);
      if (name !== "index.ts") return text;
      return text.replace(/^(\s*)taxYear: .*$/m, `$&\n$1${PREPARER_HINT}`);
    });
  }
}
