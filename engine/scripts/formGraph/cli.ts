/*
 * Writes docs/form-graph.md and web/data/form-graph.json: which form reads which form,
 * and which fields no scenario has checked. `npm run form-graph` runs it.
 */

import { readdirSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { ENGINE_ROOT, engineSrcDir } from "../../paths.js";
import { loadFromFixtures, type Catalog } from "../../src/catalog.js";
import { bindingKind } from "../../src/engine.js";
import { FORMS, registerAllForms } from "../../src/registry.js";
import { evaluateScenarioForms } from "../../tests/golden/runScenario.js";
import { catalogPath, catalogTaxYear } from "../../tests/helpers/formPaths.js";
import { loadScenarios } from "../../tests/scenarios/index.js";
import type { Scenario } from "../../tests/types.js";
import { jurisdictionOf } from "../coverage/report.js";
import {
  buildFormGraph,
  type CodeRead,
  type FormGraph,
  type FormInput,
  type MissingFormInput,
  type ScenarioRun,
} from "./graph.js";
import { MISSING_FORMS, missingFormId, namesOf, NOT_RETURN_FORMS } from "./missingForms.js";
import { renderFormGraph } from "./render.js";
import { sectionOf } from "./sections.js";

const REPORT_PATH = resolve(ENGINE_ROOT, "../docs/form-graph.md");
/* In the web app: its Form graph page draws the graph from this file. */
const JSON_PATH = resolve(ENGINE_ROOT, "../web/data/form-graph.json");

function formInputs(catalog: Catalog): FormInput[] {
  return FORMS.map((spec) => ({
    formId: spec.formId,
    displayName: spec.displayName,
    jurisdiction: jurisdictionOf(spec.relativeDir, catalogTaxYear(spec)).name,
    ...sectionOf(spec.formId),
    fields: catalog.getFields(spec.formId).map((field) => ({
      fieldId: field.fieldId,
      label: field.label,
      kind: bindingKind(field.fieldId),
    })),
  }));
}

async function runScenario(scenario: Scenario): Promise<ScenarioRun> {
  const { forms } = await evaluateScenarioForms(scenario);
  return {
    name: scenario.name,
    hasAnswerKey: scenario.verification !== "unverified",
    formIds: scenario.forms.map((form) => form.formId),
    fields: [...forms.values()].flatMap((form) =>
      form.fields.map((field) => ({
        fieldId: field.fieldId,
        hasValue: field.result.ok,
        reads: field.reads ?? [],
        unsupportedReason:
          !field.result.ok && field.result.unsupported ? field.result.reason : undefined,
      })),
    ),
  };
}

/* The text of every .ts file in a form's folder, without its generated field list. */
function formCode(relativeDir: string): string {
  const dir = resolve(engineSrcDir, relativeDir);
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".ts") && !file.endsWith("types.ts"))
    .map((file) => readFileSync(join(dir, file), "utf8"))
    .join("\n");
}

/* A read of another form names the field's full id as a string. */
function codeReads(forms: FormInput[]): CodeRead[] {
  return FORMS.flatMap((spec) => {
    const code = formCode(spec.relativeDir);
    return forms
      .filter((form) => form.formId !== spec.formId && code.includes(`"${form.formId}.`))
      .flatMap((form) => form.fields)
      .filter((field) => code.includes(`"${field.fieldId}"`))
      .map((field) => ({ readerFormId: spec.formId, fieldId: field.fieldId }));
  });
}

/* The forms the engine lacks carry the tax year of the forms it has. */
function missingFormInputs(forms: FormInput[]): MissingFormInput[] {
  const taxYear = Math.max(...FORMS.map(catalogTaxYear));
  const have = new Set(forms.map((form) => form.formId));
  return MISSING_FORMS.map((form) => {
    const formId = missingFormId(form);
    if (have.has(formId)) throw new Error(`missingForms.ts lists ${form.name}: the engine has it.`);
    return {
      formId,
      displayName: form.name,
      about: form.about,
      jurisdiction: jurisdictionOf(form.jurisdiction, taxYear).name,
      section: form.section,
      names: namesOf(form),
    };
  });
}

/* One form, edge or field on each line, so a change shows as a short diff. */
function graphJson(graph: FormGraph): string {
  const rows = (items: unknown[]): string =>
    `[\n${items.map((item) => JSON.stringify(item)).join(",\n")}\n]`;
  return [
    `{"scenarios":${graph.scenarios}`,
    `"forms":${rows(graph.forms)}`,
    `"edges":${rows(graph.edges)}`,
    `"fields":${rows(graph.fields)}`,
    `"missing":${rows(graph.missing)}`,
    `"unclassified":${rows(graph.unclassified)}`,
    `"loops":${rows(graph.loops)}}\n`,
  ].join(",\n");
}

async function main() {
  registerAllForms();
  /* Each form's own catalog.json: a form with no code yet is not in the engine's built catalog. */
  const catalog = await loadFromFixtures(FORMS.map(catalogPath));
  const forms = formInputs(catalog);
  const scenarios = (await loadScenarios()).filter((scenario) => !scenario.skip);
  const runs: ScenarioRun[] = [];
  for (const scenario of scenarios) runs.push(await runScenario(scenario));

  const graph = buildFormGraph({
    forms,
    runs,
    codeReads: codeReads(forms),
    missingForms: missingFormInputs(forms),
    otherNames: NOT_RETURN_FORMS,
  });
  await writeFile(REPORT_PATH, renderFormGraph(graph));
  await writeFile(JSON_PATH, graphJson(graph));
  console.log(
    `Wrote ${relative(process.cwd(), REPORT_PATH)} and ${relative(process.cwd(), JSON_PATH)}`,
  );
  if (graph.loops.length > 0) {
    console.error(`${graph.loops.length} field loop(s): see the Loops section.`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
