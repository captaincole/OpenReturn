/*
 * Engine public API. Tools, HTTP routes, and scripts call into the engine
 * through these two functions:
 *
 *   evaluateScenario({filing, facts, decisions, authEmail?}) → EvaluatedScenario
 *   renderForm(scenario, formId, loadBlankPdf)               → RenderedForm
 *
 * The engine never touches a database. Callers load the filing's fact and
 * decision rows (see mastra/loadScenario.ts for the runtime bridge) and
 * pass them in, newest-first. evaluateScenario supersedes them to
 * most-recent-per-key, projects them into FilingInfo, and
 * fixpoint-evaluates every registered form against the resulting context.
 * It returns the evaluated forms map plus the underlying facts,
 * decisions, filingInfo, and authEmail. Downstream consumers (case-state
 * summarizer, document generator) can then compute their own derived
 * views without re-reading anything. authEmail is enrichment only: Luca
 * acknowledges it back to the user at doc-gen time. Callers pass the
 * instance owner's email; it is never load-bearing for evaluation.
 *
 * renderForm fills the catalog widgets on a form's blank PDF with the
 * values that evaluateScenario produced. The caller supplies the blank
 * PDF through a BlankPdfLoader: the engine reads no files, so where the
 * PDFs live (the agent's runtime tree, the forms package) is the
 * caller's business.
 *
 * Neither function persists documents. Tools wrap renderForm with
 * createDocument() to store a user-visible draft.
 */

import { evaluateAllForms } from "./engine.js";
import type { AIDecisionRow, TaxFactRow } from "./facts/rows.js";
import { resolveFilingInfo, type FilingInfo } from "./filingInfo.js";
import { FORMS, catalog as bundledCatalog, getFormSpec, registerAllForms } from "./registry.js";
import { type RenderedWidget } from "./render/fillFromCatalog.js";
import { renderFormCopies } from "./render/renderCopies.js";
import {
  makeDecisionsView,
  makeFactsView,
  type AnyFormField,
  type DerivationContext,
  type EvaluatedForm,
} from "./types.js";

export interface EngineFiling {
  id: string;
  taxYear: number;
}

export interface ScenarioInputs {
  filing: EngineFiling;
  /** Raw rows, newest-first (as the list* loaders return them). The engine supersedes. */
  facts: TaxFactRow[];
  decisions: AIDecisionRow[];
  authEmail?: string | null;
}

export interface EvaluatedScenario {
  filing: EngineFiling;
  /** Superseded: one row per key, most recent. */
  facts: TaxFactRow[];
  /** Superseded: one row per decisionKey, most recent. */
  decisions: AIDecisionRow[];
  filingInfo: FilingInfo;
  authEmail: string | null;
  /** Every registered form, keyed by formId. */
  forms: Map<string, EvaluatedForm<AnyFormField>>;
  /** The context the forms were evaluated with. Rendering extra copies reuses it. */
  ctx: DerivationContext;
}

/**
 * Reads one form's blank PDF. relativeDir is the form's folder (for
 * example "federal/1040"); taxYear is the filing's year.
 */
export type BlankPdfLoader = (form: {
  relativeDir: string;
  taxYear: number;
}) => Promise<Uint8Array>;

export interface RenderedForm {
  pdfBytes: Buffer;
  rendered: Map<string, RenderedWidget[]>;
  warnings: string[];
}

/*
 * Only evaluate forms that have bindings (a `register` fn). The bundled
 * runtime `catalog` spans exactly these forms. The "catalog-only" entries
 * in FORMS (schedule-b, schedule-2, 8889, 8960) exist solely for the
 * catalog-fill regression test, which loads catalogs from disk. They have
 * no bindings and are NOT in the bundled catalog. Evaluating them here
 * would throw "no form … in the Catalog" and 500 the case-state build.
 */
const SCENARIO_FORM_IDS = FORMS.filter((f) => f.register).map((f) => f.formId);

/**
 * Collapse a list to most-recent-per-key. The caller-supplied keyer
 * extracts the dedup key. Rows arrive newest-first, so first-seen wins.
 */
function supersede<T>(rows: T[], keyer: (row: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const key = keyer(row);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export function evaluateScenario(inputs: ScenarioInputs): EvaluatedScenario {
  const { filing, authEmail = null } = inputs;

  /*
   * Register all form bindings before evaluation. Registration is
   * idempotent (a second call overwrites in place) and cheap, so it runs
   * on every call rather than rely on module-load side effects.
   */
  registerAllForms();

  const facts = supersede(inputs.facts, (r) => r.key);
  const decisions = supersede(inputs.decisions, (r) => r.decisionKey);

  const filingInfo = resolveFilingInfo({
    facts: facts.map((f) => ({ key: f.key, value: f.value, category: f.category })),
    decisions: decisions.map((d) => ({ decisionKey: d.decisionKey, decision: d.decision })),
  });

  const ctx: DerivationContext = {
    taxYear: filing.taxYear,
    facts: makeFactsView(facts),
    decisions: makeDecisionsView(decisions),
    /*
     * Bindings read every input through ctx.filingInfo, the
     * resolver-projected view of facts + decisions. Without it, every
     * binding blocks with "filingInfo missing" and forms render empty.
     */
    filingInfo,
  };

  const { forms } = evaluateAllForms(SCENARIO_FORM_IDS, ctx, bundledCatalog);

  return { filing, facts, decisions, filingInfo, authEmail, forms, ctx };
}

/**
 * Render one of the scenario's evaluated forms to PDF bytes. The loader
 * supplies the blank PDF.
 *
 * Returns the filled PDF, a map of rendered widgets (tests assert on
 * rendered values), and a warnings list (widget missing, maxLength
 * exceeded, etc.). A non-empty warnings list means a soft regression.
 */
export async function renderForm(
  scenario: EvaluatedScenario,
  formId: string,
  loadBlankPdf: BlankPdfLoader,
): Promise<RenderedForm> {
  const spec = getFormSpec(formId);
  const form = scenario.forms.get(formId);
  if (!form) {
    throw new Error(
      `renderForm: no evaluation result for formId "${formId}". ` +
        `Was evaluateScenario called with a registry that includes this form?`,
    );
  }
  const blankPdfBytes = await loadBlankPdf({
    relativeDir: spec.relativeDir,
    taxYear: scenario.filing.taxYear,
  });
  return renderFormCopies({
    spec,
    form,
    ctx: scenario.ctx,
    catalog: bundledCatalog,
    blankPdfBytes,
  });
}
