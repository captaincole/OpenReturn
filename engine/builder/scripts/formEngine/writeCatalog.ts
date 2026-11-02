import { writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { catalogFromLabels } from "../../src/catalogFromLabels.js";
import { formTargetFromArgv, REPO_ROOT } from "../../src/formTarget.js";
import { readLabelsFile, readWidgetsFile } from "../../src/workFiles.js";
import type { Command } from "../lib/cli";

async function run(argv: string[]): Promise<void> {
  const target = formTargetFromArgv(argv);
  const outFlag = argv.find((arg) => arg.startsWith("--out="));
  const outPath = outFlag ? resolve(outFlag.slice("--out=".length)) : target.catalogPath;
  const widgets = await readWidgetsFile(target);
  const labels = await readLabelsFile(target);
  const fields = catalogFromLabels(widgets, labels);

  const payload = {
    form: widgets.form,
    fields,
    _meta: {
      sourcePdf: widgets.sourcePdf,
      ingestedAt: new Date().toISOString(),
      totalFields: widgets.fields.length,
      skipped: labels.skipped.length,
      catalogEntries: fields.length,
    },
  };
  await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`write-catalog: ${target.formId} (${target.taxYear})`);
  console.log(`  ${fields.length} catalog entries, ${labels.skipped.length} skipped`);
  console.log(`  wrote ${relative(REPO_ROOT, outPath)}`);
}

export const writeCatalogCommand: Command = {
  name: "write-catalog",
  summary:
    "widgets.json + labels.json → catalog.json, after checking every widget (no model calls)",
  usage: "<federal/<short> | state/<st>/<short>>",
  options: [
    { flag: "--out=<path>", desc: "write here instead of the form's catalog.json" },
    { flag: "--tax-year=<year>", desc: "default 2025" },
  ],
  run,
};
