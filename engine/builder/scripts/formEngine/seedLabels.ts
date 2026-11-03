import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { relative } from "node:path";
import { formTargetFromArgv, REPO_ROOT } from "../../src/formTarget.js";
import { seedLabels } from "../../src/seedLabels.js";
import { labelsPath, readWidgetsFile } from "../../src/workFiles.js";
import type { Command } from "../lib/cli";

async function run(argv: string[]): Promise<void> {
  const target = formTargetFromArgv(argv);
  if (!existsSync(target.catalogPath)) {
    throw new Error(`${target.formId} has no catalog.json: label every page instead`);
  }
  const out = labelsPath(target);
  if (existsSync(out) && !argv.includes("--force")) {
    throw new Error(`${relative(REPO_ROOT, out)} exists: pass --force to replace it`);
  }
  const widgets = await readWidgetsFile(target);
  const catalog = JSON.parse(await readFile(target.catalogPath, "utf8"));
  const seeded = seedLabels(widgets, catalog.fields);
  await writeFile(out, `${JSON.stringify(seeded.labels, null, 2)}\n`, "utf8");

  if (argv.includes("--json")) {
    console.log(JSON.stringify({ unlabeled: seeded.unlabeled, stale: seeded.stale }, null, 2));
    return;
  }
  console.log(`seed-labels: ${target.formId} (${target.taxYear})`);
  console.log(`  ${seeded.labels.fields.length} fields from catalog.json`);
  console.log(`  wrote ${relative(REPO_ROOT, out)}`);
  for (const { page, fieldNames } of seeded.unlabeled) {
    console.log(`  page ${page}: ${fieldNames.length} widget(s) to label or skip`);
  }
  if (seeded.stale.length > 0) {
    console.log(
      `  ${seeded.stale.length} catalog row(s) with no widget: ${seeded.stale.join(", ")}`,
    );
  }
}

export const seedLabelsCommand: Command = {
  name: "seed-labels",
  summary: "catalog.json + widgets.json → labels.json, keeping every fieldId (no API calls)",
  usage: "<federal/<short> | state/<st>/<short>>",
  options: [
    { flag: "--json", desc: "print the widgets left to label, and the stale rows, as JSON" },
    { flag: "--force", desc: "replace an existing labels.json" },
    { flag: "--tax-year=<year>", desc: "default 2025" },
  ],
  run,
};
