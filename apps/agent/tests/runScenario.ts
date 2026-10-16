/*
 * Generic scenario runner. Takes a Scenario (facts + decisions + per-form
 * expected results). Drives the full render pipeline (engine + PDF fill)
 * for every form in scenario.forms[], fully in memory. Asserts the actual
 * output against expected. Returns a RunResult for runAll.ts to aggregate.
 *
 * No network, no database, no LLM calls. Suitable for pre-commit hooks.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadFromFixtures, type Catalog } from "../src/engine/catalog.js";
import { evaluateAllForms } from "../src/engine/engine.js";
import { resolveFilingInfo } from "../src/engine/filingInfo.js";
import { getFormSpec } from "../src/engine/registry.js";
import { fillFromCatalog } from "../src/engine/render/fillFromCatalog.js";
import { makeDecisionsView, makeFactsView, type DerivationContext } from "../src/engine/types.js";
import { projectRoot } from "../src/paths.js";
import {
  assertEngineNumber,
  assertMatchesGolden,
  assertNotRendered,
  assertRenderedChecked,
  assertRenderedText,
} from "./helpers/assertions.js";
import { readGoldenPdfValues } from "./helpers/goldenPdf.js";
import { decisionsWithPreparerStyle } from "./helpers/preparer.js";
import type { RunResult, Scenario, ScenarioForm } from "./types.js";

/*
 * Cache the combined catalog (all forms loaded into one), keyed on the
 * joined paths. Scenarios that touch different form sets get distinct
 * catalogs. evaluateAllForms needs every referenced form in one catalog
 * so that cross-form lookups resolve.
 */
const combinedCatalogCache = new Map<string, Promise<Catalog>>();
function getCombinedCatalog(catalogPaths: string[]): Promise<Catalog> {
  const key = catalogPaths.slice().sort().join("|");
  const cached = combinedCatalogCache.get(key);
  if (cached) return cached;
  const promise = loadFromFixtures(catalogPaths);
  combinedCatalogCache.set(key, promise);
  return promise;
}

const blankPdfCache = new Map<string, Buffer>();
function getBlankPdf(blankPdfPath: string): Buffer {
  const cached = blankPdfCache.get(blankPdfPath);
  if (cached) return cached;
  const buf = readFileSync(blankPdfPath);
  blankPdfCache.set(blankPdfPath, buf);
  return buf;
}

const registeredForms = new Set<string>();

export async function runScenario(s: Scenario): Promise<RunResult> {
  const t0 = Date.now();
  const failures: string[] = [];
  const notModeled: string[] | undefined = s.allowNotModeled ? [] : undefined;
  const known = s.allowNotModeled
    ? { causes: s.knownMismatches ?? {}, hits: [] as string[] }
    : undefined;

  const decisions = decisionsWithPreparerStyle(s);
  const ctx: DerivationContext = {
    taxYear: s.taxYear,
    facts: makeFactsView(s.facts),
    decisions: makeDecisionsView(decisions),
    /*
     * defineForm bindings read their inputs through ctx.filingInfo (the
     * AI-resolver layer; a hand-coded stand-in today). Every registered
     * form uses defineForm, and the engine throws when ctx.filingInfo is
     * missing. Populate it here.
     */
    filingInfo: resolveFilingInfo({
      facts: s.facts.map((f) => ({
        key: f.key,
        value: f.value,
        category: f.category,
      })),
      decisions: decisions.map((d) => ({
        decisionKey: d.decisionKey,
        decision: d.decision,
      })),
    }),
  };

  /*
   * Look up each scenario form's static config (catalog/blank/register)
   * from the shared registry. Scenarios list only `{ formId, expected }`;
   * everything else comes from src/engine/registry.ts.
   */
  const specs = s.forms.map((sf) => ({ sf, spec: getFormSpec(sf.formId) }));

  /*
   * Register bindings for every form once. evaluateAllForms reads
   * bindings from the engine registry, so each form in the scenario
   * needs its register() call to have run.
   */
  for (const { spec } of specs) {
    if (!registeredForms.has(spec.formId)) {
      spec.register?.();
      registeredForms.add(spec.formId);
    }
  }

  /*
   * One combined catalog across every form in the scenario. Cross-form
   * lookups (e.g. CA 540 line 13 reads form-1040 line 11b) then find
   * their target inventory rows in one place.
   */
  const catalog = await getCombinedCatalog(specs.map((s) => s.spec.catalogPath));

  /*
   * Fixpoint loop: evaluate every form and iterate until cross-form refs
   * converge. Returns a Map<formId, EvaluatedForm> plus passes and
   * resolvedPerPass diagnostics for non-convergence debugging.
   */
  const { forms, passes, resolvedPerPass } = evaluateAllForms(
    s.forms.map((f) => f.formId),
    ctx,
    catalog,
  );

  // Per-form rendering + assertions.
  for (const { sf, spec } of specs) {
    const evaluated = forms.get(sf.formId);
    if (!evaluated) {
      failures.push(`[${sf.formId}] evaluateAllForms returned no result.`);
      continue;
    }
    await assertForm(sf, spec.blankPdfPath, evaluated, catalog, failures, notModeled, known);
  }

  return {
    name: s.name,
    passed: failures.length === 0,
    failures,
    durationMs: Date.now() - t0,
    fixpointPasses: passes,
    resolvedPerPass,
    notModeled,
    knownMismatches: known?.hits,
  };
}

async function assertForm(
  sf: ScenarioForm,
  blankPdfPath: string,
  form: ReturnType<typeof evaluateAllForms>["forms"] extends Map<string, infer V> ? V : never,
  catalog: Catalog,
  failures: string[],
  notModeled?: string[],
  known?: { causes: Record<string, string>; hits: string[] },
): Promise<void> {
  /*
   * fillFromCatalog walks the catalog inventory and writes each value into
   * its PDF widget. One function handles every form.
   */
  const { rendered, warnings } = await fillFromCatalog({
    blankPdfBytes: getBlankPdf(blankPdfPath),
    form,
    catalog,
  });

  const prefix = sf.formId;

  if (notModeled) {
    /*
     * Not-modeled reporting hides a missing field, so a typo in an
     * expected fieldId would hide too. Check every id against the catalog.
     */
    const known = new Set(catalog.getFields(sf.formId).map((f) => f.fieldId));
    const ids = [...Object.keys(sf.expected.engineFields), ...sf.expected.renderedChecked];
    for (const id of ids) {
      if (!known.has(id)) failures.push(`[${prefix}] unknown fieldId ${id} (not in catalog).`);
    }
  }

  for (const [fieldId, expected] of Object.entries(sf.expected.engineFields)) {
    const cause = known?.causes[fieldId];
    if (!known || cause === undefined) {
      assertEngineNumber(form, fieldId, expected, failures, prefix, notModeled);
      continue;
    }
    /* Ratchet: route a listed line's result instead of failing on it. */
    const own: string[] = [];
    const nmBefore = notModeled?.length ?? 0;
    assertEngineNumber(form, fieldId, expected, own, prefix, notModeled);
    if (own.length > 0) {
      known.hits.push(`[${prefix}] ${fieldId} — ${cause}`);
    } else if ((notModeled?.length ?? 0) === nmBefore) {
      failures.push(`[${prefix}] ${fieldId} now matches — remove it from knownMismatches.`);
    }
  }
  for (const [fieldId, expected] of Object.entries(sf.expected.renderedText)) {
    assertRenderedText(rendered, fieldId, expected, failures, prefix);
  }
  for (const fieldId of sf.expected.renderedBlank) {
    assertNotRendered(rendered, fieldId, failures, prefix);
  }
  for (const fieldId of sf.expected.renderedChecked) {
    const f = form.fields.find((x) => x.fieldId === fieldId);
    if (notModeled && (!f || (!f.result.ok && f.result.unsupported))) {
      notModeled.push(`[${prefix}] ${fieldId} (expected checked)`);
      continue;
    }
    assertRenderedChecked(rendered, fieldId, failures, prefix);
  }

  /*
   * Golden-PDF widget-level diff, when a goldenPdfPath is provided. The
   * fieldId-based assertions above trust the catalog's `fieldId → widget`
   * mapping, so they cannot see catalog mislabels. This layer compares
   * directly against a CPA-completed PDF and catches them.
   */
  if (sf.goldenPdfPath) {
    const golden = await readGoldenPdfValues(resolve(projectRoot, sf.goldenPdfPath));
    assertMatchesGolden(rendered, golden, failures, prefix);
  }

  if (warnings.length > 0) {
    failures.push(`[${prefix}] fillForm produced ${warnings.length} warning(s):`);
    for (const w of warnings) failures.push(`  - ${w}`);
  }
}
