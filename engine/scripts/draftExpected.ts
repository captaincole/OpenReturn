/*
 * Writes a new scenario's first expected.ts from the engine's output. It
 * refuses a scenario whose expected.ts already asserts engineFields: after
 * the first draft, change an expected value by hand, after you verify it.
 * Zeros are left out (a filed-return comparison treats blank and 0 as
 * equal, so it never verifies a zero); add a verified zero by hand.
 * After a draft, write the golden PDFs: renderScenario.ts --scenario=<name> --golden.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { evaluateScenario } from "../src/index.js";
import { catalog } from "../src/registry.js";
import { decisionsWithPreparerStyle } from "../tests/helpers/preparer.js";
import type { ExpectedResults, Scenario } from "../tests/types.js";

function draftedFields(scenario: Scenario): Record<string, Record<string, number>> {
  const evaluated = evaluateScenario({
    filing: { id: scenario.name, taxYear: scenario.taxYear },
    facts: scenario.facts,
    decisions: decisionsWithPreparerStyle(scenario),
  });
  const out: Record<string, Record<string, number>> = {};
  for (const { formId } of scenario.forms) {
    const form = evaluated.forms.get(formId);
    if (!form?.mustFile.ok || form.mustFile.value !== true) continue;
    const fields: Record<string, number> = {};
    for (const field of form.fields) {
      const { result } = field;
      if (field.valueType !== "numeric" || !result.ok || typeof result.value !== "number") continue;
      if (result.value !== 0) fields[field.fieldId] = result.value;
    }
    if (Object.keys(fields).length > 0) out[formId] = fields;
  }
  return out;
}

const label = (fieldId: string) =>
  (catalog.getField(fieldId)?.label ?? "").replace(/\s+/g, " ").trim().slice(0, 90);

function formBlock(
  formId: string,
  fields: Record<string, number>,
  kept: ExpectedResults,
): string[] {
  const lines = [`  ${JSON.stringify(formId)}: {`, "    engineFields: {"];
  for (const [id, value] of Object.entries(fields)) {
    lines.push(`      // ${label(id)}`, `      ${JSON.stringify(id)}: ${value},`);
  }
  lines.push("    },");
  for (const key of ["renderedText", "renderedBlank", "renderedChecked"] as const) {
    const value = kept[key];
    if (Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0) {
      lines.push(`    ${key}: ${JSON.stringify(value)},`);
    }
  }
  lines.push("  },");
  return lines;
}

const UNVERIFIED_NOTE = [
  " *",
  " * UNVERIFIED: no CPA return or filed-return check stands behind these",
  " * values. They are engine output, checked by hand, so a failure means",
  ' * "the engine changed", not "the engine is wrong".',
];

function render(
  scenario: Scenario,
  fnName: string,
  drafted: Record<string, Record<string, number>>,
  current: (formId: string) => ExpectedResults,
): string {
  const today = new Date().toISOString().slice(0, 10);
  const head = [
    "/*",
    ` * ${scenario.name} — LOCKED expected values, drafted from the engine's`,
    ` * output on ${today} (scripts/draftExpected.ts).`,
    ...(scenario.verification === "unverified" ? UNVERIFIED_NOTE : []),
    " *",
    " * Edit by hand. Change a value only after you verify it against the form",
    " * instructions or a filed return (scripts/compareFiled).",
    " */",
    "",
    'import type { ExpectedResults } from "../../types.js";',
    "",
    "const EXPECTED: Record<string, Partial<ExpectedResults>> = {",
  ];
  const body = Object.entries(drafted).flatMap(([formId, fields]) =>
    formBlock(formId, fields, current(formId)),
  );
  const tail = [
    "};",
    "",
    `export function ${fnName}(formId: string): ExpectedResults {`,
    "  const expected = EXPECTED[formId] ?? {};",
    "  return {",
    "    engineFields: expected.engineFields ?? {},",
    "    renderedText: expected.renderedText ?? {},",
    "    renderedBlank: expected.renderedBlank ?? [],",
    "    renderedChecked: expected.renderedChecked ?? [],",
    "  };",
    "}",
    "",
  ];
  return [...head, ...body, ...tail].join("\n");
}

async function main(): Promise<void> {
  const { values } = parseArgs({ options: { scenario: { type: "string" } } });
  const name = values.scenario;
  if (!name) throw new Error("usage: tsx scripts/draftExpected.ts --scenario=<name>");
  const dir = resolve(process.cwd(), "tests/scenarios", name);
  const index = (await import(resolve(dir, "index.ts"))) as Record<string, Scenario>;
  const expected = (await import(resolve(dir, "expected.ts"))) as Record<string, unknown>;
  const scenario = index[`${name}Scenario`];
  const fnName = `${name}Expected`;
  const current = expected[fnName] as ((formId: string) => ExpectedResults) | undefined;
  if (!scenario || !current) {
    throw new Error(`need ${name}Scenario and ${fnName} exports in ${dir}`);
  }
  const asserted = scenario.forms.filter(
    ({ formId }) => Object.keys(current(formId).engineFields).length > 0,
  );
  if (asserted.length > 0) {
    throw new Error(
      `${name}/expected.ts already asserts engineFields (${asserted.map(({ formId }) => formId).join(", ")}). ` +
        "Edit it by hand: this script only drafts a new scenario.",
    );
  }
  const drafted = draftedFields(scenario);
  writeFileSync(resolve(dir, "expected.ts"), render(scenario, fnName, drafted, current));
  const count = Object.values(drafted).reduce(
    (total, fields) => total + Object.keys(fields).length,
    0,
  );
  console.log(
    `Drafted ${count} line(s) across ${Object.keys(drafted).length} form(s) in ${dir}/expected.ts. ` +
      "Check each line before you commit it.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
