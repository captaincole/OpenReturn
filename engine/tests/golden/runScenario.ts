import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ENGINE_ROOT } from "../../paths.js";
import { loadFromFixtures, type Catalog } from "../../src/catalog.js";
import { evaluateAllForms } from "../../src/engine.js";
import { resolveFilingInfo } from "../../src/filingInfo.js";
import { getFormSpec } from "../../src/registry.js";
import { fillFromCatalog } from "../../src/render/fillFromCatalog.js";
import { makeDecisionsView, makeFactsView, type DerivationContext } from "../../src/types.js";
import {
  assertEngineNumber,
  assertMatchesGolden,
  assertNotRendered,
  assertRenderedChecked,
  assertRenderedText,
  type KnownWidgets,
} from "../helpers/assertions.js";
import { blankPdfPath, catalogPath } from "../helpers/formPaths.js";
import { readGoldenPdfValues, type GoldenValue } from "../helpers/goldenPdf.js";
import { decisionsWithPreparerStyle } from "../helpers/preparer.js";
import type { RunResult, Scenario, ScenarioForm } from "../types.js";

/* evaluateAllForms needs every referenced form in one catalog so cross-form lookups resolve. */
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

/*
 * The golden PDF's widgets, less those the blank PDF already fills and the
 * catalog does not list: the amounts the IRS prints in a fillable box (Form
 * 8826 lines 2 and 4, $250 and $10,000) are the form's text, not the engine's.
 */
async function goldenWidgetsOf(
  goldenPdfPath: string,
  blankPdfPath: string,
  formId: string,
  catalog: Catalog,
): Promise<Map<string, GoldenValue>> {
  const golden = await readGoldenPdfValues(resolve(ENGINE_ROOT, goldenPdfPath));
  const cataloged = new Set(catalog.getFields(formId).map((field) => field.pdfWidgetName));
  const blank = await readGoldenPdfValues(blankPdfPath);
  for (const [widgetName, value] of blank) {
    const printed = value.kind === "text" && value.value !== "";
    if (printed && !cataloged.has(widgetName) && golden.get(widgetName)?.value === value.value) {
      golden.delete(widgetName);
    }
  }
  return golden;
}

const registeredForms = new Set<string>();

export async function evaluateScenarioForms(
  scenario: Scenario,
  formIds: string[] = scenario.forms.map((form) => form.formId),
): Promise<ReturnType<typeof evaluateAllForms> & { catalog: Catalog }> {
  const decisions = decisionsWithPreparerStyle(scenario);
  const ctx: DerivationContext = {
    taxYear: scenario.taxYear,
    facts: makeFactsView(scenario.facts),
    decisions: makeDecisionsView(decisions),
    /* The engine throws when ctx.filingInfo is missing. */
    filingInfo: resolveFilingInfo({
      facts: scenario.facts.map((fact) => ({
        key: fact.key,
        value: fact.value,
        category: fact.category,
      })),
      decisions: decisions.map((decision) => ({
        decisionKey: decision.decisionKey,
        decision: decision.decision,
      })),
    }),
  };

  const specs = formIds.map((formId) => getFormSpec(formId));

  /* evaluateAllForms reads bindings from the global registry, so register() must run first. */
  for (const spec of specs) {
    if (!registeredForms.has(spec.formId)) {
      spec.register?.();
      registeredForms.add(spec.formId);
    }
  }

  const catalog = await getCombinedCatalog(specs.map(catalogPath));

  return { ...evaluateAllForms(formIds, ctx, catalog), catalog };
}

export async function runScenario(scenario: Scenario): Promise<RunResult> {
  const t0 = Date.now();
  const failures: string[] = [];
  const notModeled: string[] | undefined = scenario.allowNotModeled ? [] : undefined;
  const known = scenario.knownMismatches
    ? { causes: scenario.knownMismatches, hits: [] as string[] }
    : undefined;

  const specs = scenario.forms.map((sf) => ({ sf, spec: getFormSpec(sf.formId) }));
  const { forms, passes, resolvedPerPass, catalog } = await evaluateScenarioForms(scenario);

  for (const { sf, spec } of specs) {
    const evaluated = forms.get(sf.formId);
    if (!evaluated) {
      failures.push(`[${sf.formId}] evaluateAllForms returned no result.`);
      continue;
    }
    await assertForm(
      sf,
      blankPdfPath({ relativeDir: spec.relativeDir, taxYear: scenario.taxYear }),
      evaluated,
      catalog,
      failures,
      notModeled,
      known,
    );
  }

  return {
    name: scenario.name,
    passed: failures.length === 0,
    failures,
    durationMs: Date.now() - t0,
    fixpointPasses: passes,
    resolvedPerPass,
    notModeled,
    knownMismatches: known?.hits,
  };
}

/* The golden PDF widgets of the listed lines: a mismatch there is a known hit (staleness is checked on the expected value). */
function knownWidgets(
  formId: string,
  catalog: Catalog,
  known?: { causes: Record<string, string>; hits: string[] },
): KnownWidgets | undefined {
  if (!known) return undefined;
  const widgets = new Map<string, { fieldId: string; cause: string }>();
  for (const field of catalog.getFields(formId)) {
    const cause = known.causes[field.fieldId];
    if (cause !== undefined && field.pdfWidgetName) {
      widgets.set(field.pdfWidgetName, { fieldId: field.fieldId, cause });
    }
  }
  return { widgets, hits: known.hits };
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
  const { rendered, warnings } = await fillFromCatalog({
    blankPdfBytes: getBlankPdf(blankPdfPath),
    form,
    catalog,
  });

  const prefix = sf.formId;

  if (notModeled) {
    /* Not-modeled reporting would also hide a typo in an expected fieldId. */
    const known = new Set(catalog.getFields(sf.formId).map((field) => field.fieldId));
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
    const field = form.fields.find((candidate) => candidate.fieldId === fieldId);
    if (notModeled && (!field || (!field.result.ok && field.result.unsupported))) {
      notModeled.push(`[${prefix}] ${fieldId} (expected checked)`);
      continue;
    }
    assertRenderedChecked(rendered, fieldId, failures, prefix);
  }

  /* The fieldId assertions above trust the catalog's widget mapping; the golden PDF catches mislabels. */
  if (sf.goldenPdfPath) {
    const golden = await goldenWidgetsOf(sf.goldenPdfPath, blankPdfPath, sf.formId, catalog);
    assertMatchesGolden(
      rendered,
      golden,
      failures,
      prefix,
      knownWidgets(sf.formId, catalog, known),
    );
  }

  if (warnings.length > 0) {
    failures.push(`[${prefix}] fillForm produced ${warnings.length} warning(s):`);
    for (const warning of warnings) failures.push(`  - ${warning}`);
  }
}
