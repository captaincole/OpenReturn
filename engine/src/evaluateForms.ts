/*
 * One pass of the forms: the filing info from facts and decisions, then every
 * registered form. evaluateScenario runs it once for the return; the
 * deductions comparison runs it again as if the return itemizes.
 */

import { evaluateAllForms } from "./engine.js";
import type { AIDecisionRow, TaxFactRow } from "./facts/rows.js";
import { resolveFilingInfo, type FilingInfo } from "./filingInfo.js";
import { FORMS, catalog as bundledCatalog, registerAllForms } from "./registry.js";
import {
  makeDecisionsView,
  makeFactsView,
  type AnyFormField,
  type DerivationContext,
  type EvaluatedForm,
} from "./types.js";

export interface FormsPass {
  filingInfo: FilingInfo;
  ctx: DerivationContext;
  forms: Map<string, EvaluatedForm<AnyFormField>>;
}

/*
 * Catalog-only forms (no `register`) are not in the bundled catalog.
 * Evaluating them throws and fails the case-state build.
 */
const SCENARIO_FORM_IDS = FORMS.filter((spec) => spec.register).map((spec) => spec.formId);

/* Facts and decisions are superseded: one row per key. */
export function evaluateForms(
  taxYear: number,
  facts: TaxFactRow[],
  decisions: AIDecisionRow[],
): FormsPass {
  // Idempotent and cheap: run per call, not as a module-load side effect.
  registerAllForms();

  const filingInfo = resolveFilingInfo({
    facts: facts.map((fact) => ({ key: fact.key, value: fact.value, category: fact.category })),
    decisions: decisions.map((decision) => ({
      decisionKey: decision.decisionKey,
      decision: decision.decision,
    })),
  });

  const ctx: DerivationContext = {
    taxYear,
    facts: makeFactsView(facts),
    decisions: makeDecisionsView(decisions),
    // Without it, every binding blocks with "filingInfo missing".
    filingInfo,
  };

  const { forms } = evaluateAllForms(SCENARIO_FORM_IDS, ctx, bundledCatalog);
  return { filingInfo, ctx, forms };
}
