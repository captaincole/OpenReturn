/*
 * Engine public API: evaluateScenario, then renderForm. The engine reads no
 * database and no files. Callers pass fact, assumption and decision rows
 * newest-first, and supply blank PDFs through a BlankPdfLoader.
 */

import { fillGaps } from "./assumptions.js";
import { evaluateDeductions, type DeductionsSummary } from "./deductions/evaluate.js";
import { bindingKind as registeredBindingKind } from "./engine.js";
import { evaluateForms } from "./evaluateForms.js";
import type { AIDecisionRow, TaxFactRow } from "./facts/rows.js";
import type { FilingInfo } from "./filingInfo.js";
import { catalog as bundledCatalog, getFormSpec, registerAllForms } from "./registry.js";
import { type RenderedWidget } from "./render/fillFromCatalog.js";
import { renderFormCopies } from "./render/renderCopies.js";
import type { AnyFormField, DerivationContext, EvaluatedForm } from "./types.js";

export {
  ASSUMABLE_KEYS,
  DEDUCTION_ITEMS,
  type DeductionItem,
  type ItemId,
} from "./deductions/catalog.js";
export type { DeductionsComparison, JurisdictionComparison } from "./deductions/compare.js";
export type { DeductionsSummary } from "./deductions/evaluate.js";
export type { ItemState, ItemStatus } from "./deductions/items.js";
export { pendingInputs, readyToFile, type PendingInputs } from "./pendingInputs.js";
export { FORMS, getFormSpec, type FormSpec } from "./registry.js";
export type { AnyFormField, BaseFormField, EngineDerivation, EvaluatedForm } from "./types.js";

/* Which kind of rule a catalog field has: a binding, an unsupported reason, or none yet. */
export function bindingKind(fieldId: string): "binding" | "unsupported" | undefined {
  registerAllForms();
  return registeredBindingKind(fieldId);
}

export interface EngineFiling {
  id: string;
  taxYear: number;
}

export interface ScenarioInputs {
  filing: EngineFiling;
  /** Newest-first. The engine supersedes. */
  facts: TaxFactRow[];
  /**
   * Numbers for calculations only, in the fact row shape, newest-first. Each one
   * fills a key with no fact; a fact always wins (assumptions.ts).
   */
  assumptions?: TaxFactRow[];
  decisions: AIDecisionRow[];
  authEmail?: string | null;
}

export interface EvaluatedScenario {
  filing: EngineFiling;
  /** The facts only, superseded. The forms also read the assumptions in use. */
  facts: TaxFactRow[];
  /** Assumptions whose key has no fact: while any is here, the return is not ready to file. */
  assumptionsInUse: TaxFactRow[];
  decisions: AIDecisionRow[];
  filingInfo: FilingInfo;
  authEmail: string | null;
  forms: Map<string, EvaluatedForm<AnyFormField>>;
  ctx: DerivationContext;
  /** The deductions catalog's item states and the itemized-or-standard comparison (#92). */
  deductions: DeductionsSummary;
}

export type BlankPdfLoader = (form: {
  relativeDir: string;
  taxYear: number;
}) => Promise<Uint8Array>;

export interface RenderedForm {
  pdfBytes: Buffer;
  rendered: Map<string, RenderedWidget[]>;
  warnings: string[];
}

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
  const facts = supersede(inputs.facts, (fact) => fact.key);
  const assumptions = supersede(inputs.assumptions ?? [], (assumption) => assumption.key);
  const filled = fillGaps(facts, assumptions);
  const decisions = supersede(inputs.decisions, (decision) => decision.decisionKey);

  const { filingInfo, ctx, forms } = evaluateForms(filing.taxYear, filled.facts, decisions);
  const deductions = evaluateDeductions({
    taxYear: filing.taxYear,
    facts: filled.facts,
    assumedKeys: new Set(filled.assumptionsInUse.map((assumption) => assumption.key)),
    decisions,
  });

  const { assumptionsInUse } = filled;
  return {
    filing,
    facts,
    assumptionsInUse,
    decisions,
    filingInfo,
    authEmail,
    forms,
    ctx,
    deductions,
  };
}

// A non-empty warnings list means a soft regression.
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
