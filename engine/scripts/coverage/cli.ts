/*
 * Writes docs/coverage.md and docs/individual-forms.md, and the two tables in the root README. The coverage numbers come from the
 * c8 run of the golden suite (coverage/coverage-summary.json); the form lists are in scripts/formLists.
 * `npm run coverage` runs both; this file alone reads the last run.
 */

import { readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { ENGINE_ROOT, engineSrcDir } from "../../paths.js";
import { loadFromFixtures, type Catalog } from "../../src/catalog.js";
import { bindingKind } from "../../src/engine.js";
import { FORMS, registerAllForms } from "../../src/registry.js";
import { catalogPath, catalogTaxYear } from "../../tests/helpers/formPaths.js";
import { loadScenarios } from "../../tests/scenarios/index.js";
import type { Scenario } from "../../tests/types.js";
import { FORM_LISTS } from "../formLists/index.js";
import {
  formsOnNoList,
  renderFormListPage,
  summarizeFormList,
  type FormListSummary,
} from "./formLists.js";
import { updateReadme } from "./readme.js";
import {
  buildCoverageReport,
  jurisdictionOf,
  renderCoverageReport,
  type FileCoverage,
  type FormInput,
} from "./report.js";

const SUMMARY_PATH = resolve(ENGINE_ROOT, "coverage/coverage-summary.json");
const REPORT_PATH = resolve(ENGINE_ROOT, "../docs/coverage.md");
const README_PATH = resolve(ENGINE_ROOT, "../README.md");
const FORM_LIST_PAGE_PATH = resolve(ENGINE_ROOT, "../docs/individual-forms.md");

function formListSummaries(engineForms: FormInput[]): FormListSummary[] {
  const unlisted = formsOnNoList(FORM_LISTS, engineForms);
  if (unlisted.length > 0) {
    throw new Error(
      `These engine forms are on no list in scripts/formLists: ${unlisted.join(", ")}. Give the form's row its "short".`,
    );
  }
  return FORM_LISTS.map((list) => summarizeFormList(list, engineForms));
}

/* c8 keys each file by its absolute path, and adds one "total" entry. */
async function readFilesBySrcPath(): Promise<Record<string, FileCoverage>> {
  const summary: Record<string, FileCoverage> = JSON.parse(await readFile(SUMMARY_PATH, "utf8"));
  return Object.fromEntries(
    Object.entries(summary)
      .filter(([key]) => key !== "total")
      .map(([filePath, file]) => [relative(engineSrcDir, filePath), file]),
  );
}

function formInputs(scenarios: Scenario[], catalog: Catalog): FormInput[] {
  return FORMS.map((spec) => {
    const fields = catalog.getFields(spec.formId);
    return {
      displayName: spec.displayName,
      relativeDir: spec.relativeDir,
      jurisdiction: jurisdictionOf(spec.relativeDir, catalogTaxYear(spec)),
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
  /*
   * Each form's own catalog.json, not the engine's built catalog: a form with a
   * catalog and no bindings yet is missing there, and its fields count as 0 supported.
   */
  const catalog = await loadFromFixtures(FORMS.map(catalogPath));
  const engineForms = formInputs(scenarios, catalog);
  const report = buildCoverageReport(await readFilesBySrcPath(), engineForms);
  const formLists = formListSummaries(engineForms);
  /* The en-CA locale writes a date as 2026-11-15. */
  const date = new Date().toLocaleDateString("en-CA");
  await writeFile(
    REPORT_PATH,
    renderCoverageReport({
      report,
      date,
      scenarioCount: scenarios.length,
    }),
  );
  await writeFile(
    README_PATH,
    updateReadme(await readFile(README_PATH, "utf8"), report.jurisdictions, formLists),
  );
  await writeFile(FORM_LIST_PAGE_PATH, renderFormListPage(formLists, date));
  console.log(
    `Wrote ${relative(process.cwd(), REPORT_PATH)} and ${relative(process.cwd(), README_PATH)}`,
  );
}

main().catch((err) => {
  console.error("[coverage] fatal:", err);
  process.exit(1);
});
