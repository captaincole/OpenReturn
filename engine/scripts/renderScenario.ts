/*
 * Render every form in a scenario to disk for spot-checking.
 *
 *   npx tsx scripts/renderScenario.ts --scenario=alejandro
 *
 * Writes one PDF per form into the scenario's `docs/` folder with the
 * name pattern `<Scenario>-<FormShortName>-rendered.pdf`. It uses the
 * same engine and renderer as the tests. The output shows the current
 * state of the bindings, including current failures.
 *
 *   npx tsx scripts/renderScenario.ts --scenario=carter --golden
 *
 * --golden writes `<Scenario>-<FormShortName>-Golden.pdf` instead: the
 * locked output for a scenario with no CPA return (jordan, carter). The
 * scenario's goldenPdfPath points at it, so the test suite diffs every
 * widget. Run it with lockScenario, after the output is verified.
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { ENGINE_ROOT } from "../paths.js";
import { loadFromFixtures, type Catalog } from "../src/catalog.js";
import { evaluateAllForms } from "../src/engine.js";
import { resolveFilingInfo } from "../src/filingInfo.js";
import { getFormSpec } from "../src/registry.js";
import { fillFromCatalog } from "../src/render/fillFromCatalog.js";
import { renderFormCopies } from "../src/render/renderCopies.js";
import {
  makeDecisionsView,
  makeFactsView,
  type AnyFormField,
  type DerivationContext,
  type EvaluatedForm,
} from "../src/types.js";
import { blankPdfPath, catalogPath } from "../tests/helpers/formPaths.js";
import { scenarioPdfName, toPascal } from "../tests/helpers/scenarioPdfName.js";
import type { Scenario } from "../tests/types.js";

async function loadScenario(name: string): Promise<Scenario> {
  const mod = await import(`../tests/scenarios/${name}/index.js`);
  const candidates = [`${name}Scenario`, `${toPascal(name)}Scenario`, "default", "scenario"];
  for (const key of candidates) {
    if (mod[key]) return mod[key] as Scenario;
  }
  throw new Error(
    `loadScenario("${name}"): no Scenario export found. Tried: ${candidates.join(", ")}`,
  );
}

/* Same context construction as runScenario: facts/decisions views + resolver. */
function buildContext(s: Scenario): DerivationContext {
  return {
    taxYear: s.taxYear,
    facts: makeFactsView(s.facts),
    decisions: makeDecisionsView(s.decisions),
    filingInfo: resolveFilingInfo({
      facts: s.facts.map((f) => ({
        key: f.key,
        value: f.value,
        category: f.category,
      })),
      decisions: s.decisions.map((d) => ({
        decisionKey: d.decisionKey,
        decision: d.decision,
      })),
    }),
  };
}

/*
 * A golden is copy 0 only, unflattened: the same fill the test runner
 * makes, with the AcroForm kept so the runner can read each widget back.
 * Further copies (Form 8949 overflow) are in the -rendered.pdf only.
 */
async function renderGolden(
  form: EvaluatedForm<AnyFormField>,
  catalog: Catalog,
  blankPdfBytes: Buffer,
): Promise<{ pdfBytes: Buffer; warnings: string[]; copies: number }> {
  const { pdfBytes, warnings } = await fillFromCatalog({
    blankPdfBytes,
    form,
    catalog,
    flatten: false,
  });
  return { pdfBytes, warnings, copies: 1 };
}

async function main() {
  const { values } = parseArgs({
    options: { scenario: { type: "string" }, golden: { type: "boolean" } },
    strict: true,
  });
  const name = values.scenario;
  if (!name) {
    throw new Error("usage: tsx scripts/renderScenario.ts --scenario=<name>");
  }

  const s = await loadScenario(name);

  /*
   * Look up each scenario form's static config in the shared registry.
   * catalog/blank/register live there, not on ScenarioForm.
   */
  const specs = s.forms.map((sf) => getFormSpec(sf.formId));

  /*
   * Register every form's bindings before evaluation. These calls have
   * side effects and match what runScenario does.
   */
  for (const spec of specs) spec.register?.();

  const ctx = buildContext(s);

  const catalog = await loadFromFixtures(specs.map(catalogPath));

  const { forms, passes } = evaluateAllForms(
    s.forms.map((f) => f.formId),
    ctx,
    catalog,
  );

  console.log(
    `Rendering ${s.forms.length} form(s) for scenario "${s.name}" (engine converged in ${passes} pass${passes === 1 ? "" : "es"}):\n`,
  );

  const docsDir = resolve(ENGINE_ROOT, `tests/scenarios/${name}/docs`);

  for (const spec of specs) {
    const evaluated = forms.get(spec.formId);
    if (!evaluated) {
      console.log(`  ✗ ${spec.formId} — no evaluation result`);
      continue;
    }

    const blankPdfBytes = await readFile(
      blankPdfPath({ relativeDir: spec.relativeDir, taxYear: s.taxYear }),
    );
    const { pdfBytes, warnings, copies } = values.golden
      ? await renderGolden(evaluated, catalog, blankPdfBytes)
      : await renderFormCopies({ spec, form: evaluated, ctx, catalog, blankPdfBytes });

    const outName = scenarioPdfName(s.name, spec.formId, values.golden ? "Golden" : "rendered");
    const outPath = resolve(docsDir, outName);
    await writeFile(outPath, pdfBytes);

    const filled = evaluated.fields.filter((f) => f.result.ok).length;
    const total = evaluated.fields.length;
    console.log(
      `  ✓ ${spec.formId.padEnd(14)} → ${outName}  (${filled}/${total} fields filled${copies > 1 ? `, ${copies} copies` : ""}${warnings.length ? `, ${warnings.length} warning(s)` : ""})`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
