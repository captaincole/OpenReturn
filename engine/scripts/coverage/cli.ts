/*
 * Writes docs/coverage.md from the c8 run of the golden suite (coverage/coverage-summary.json).
 * `npm run coverage` runs both; this file alone reads the last run.
 */

import { readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { ENGINE_ROOT, engineSrcDir } from "../../paths.js";
import { bindingKind } from "../../src/engine.js";
import { catalog, FORMS, registerAllForms } from "../../src/registry.js";
import { loadScenarios } from "../../tests/scenarios/index.js";
import type { Scenario } from "../../tests/types.js";
import {
  buildCoverageReport,
  renderCoverageReport,
  type FileCoverage,
  type FormInput,
} from "./report.js";

const SUMMARY_PATH = resolve(ENGINE_ROOT, "coverage/coverage-summary.json");
const REPORT_PATH = resolve(ENGINE_ROOT, "../docs/coverage.md");

/* c8 keys each file by its absolute path, and adds one "total" entry. */
async function readFilesBySrcPath(): Promise<Record<string, FileCoverage>> {
  const summary: Record<string, FileCoverage> = JSON.parse(await readFile(SUMMARY_PATH, "utf8"));
  return Object.fromEntries(
    Object.entries(summary)
      .filter(([key]) => key !== "total")
      .map(([filePath, file]) => [relative(engineSrcDir, filePath), file]),
  );
}

function formInputs(scenarios: Scenario[]): FormInput[] {
  return FORMS.map((spec) => {
    const fields = catalog.getFields(spec.formId);
    return {
      displayName: spec.displayName,
      relativeDir: spec.relativeDir,
      scenarios: scenarios.filter((scenario) =>
        scenario.forms.some((form) => form.formId === spec.formId),
      ).length,
      fields: {
        covered: fields.filter((field) => bindingKind(field.fieldId) === "binding").length,
        total: fields.length,
      },
    };
  });
}

async function main() {
  registerAllForms();
  const scenarios = (await loadScenarios()).filter((scenario) => !scenario.skip);
  const report = buildCoverageReport(await readFilesBySrcPath(), formInputs(scenarios));
  await writeFile(
    REPORT_PATH,
    renderCoverageReport({
      report,
      /* The en-CA locale writes a date as 2026-11-15. */
      date: new Date().toLocaleDateString("en-CA"),
      scenarioCount: scenarios.length,
    }),
  );
  console.log(`Wrote ${relative(process.cwd(), REPORT_PATH)}`);
}

main().catch((err) => {
  console.error("[coverage] fatal:", err);
  process.exit(1);
});
