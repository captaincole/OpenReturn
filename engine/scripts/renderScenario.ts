/* --golden overwrites the scenario's golden PDFs. Run it only after the output is verified. */

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

/* Unflattened copy 0 only: the test runner reads each widget back from the AcroForm. */
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

  const specs = s.forms.map((sf) => getFormSpec(sf.formId));

  /* Register every form's bindings before evaluation (side effects). */
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
