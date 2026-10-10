/*
 * Core types for the Form Engine. The engine evaluates each form from a
 * DerivationContext (facts + decisions) into an EvaluatedForm (mustFile
 * result + per-field results). Evaluation is a pure function: the same
 * fact and decision state always produces the same output.
 *
 * The rules are:
 *  - Pure aggregation (sums, math, table lookups) lives in code.
 *  - Classification or judgment ALWAYS defers to an ai_decisions lookup,
 *    even when the answer is obvious.
 *  - Cross-form references go through the engine's shared fixpoint state
 *    (see evaluateAllForms in engine.ts).
 */

import type { TaxFactRow } from "./facts/rows.js";
import type { AIDecisionRow } from "./facts/rows.js";
import type { FilingInfo } from "./filingInfo.js";

// ─── Engine-derived decisions (audit trail for code-driven scope calls) ─

/**
 * Provenance record for an engine-derived scope call (for example
 * "Schedule D must be filed because two trade facts exist"). Carried on
 * EvaluatedForm next to the mustFile boolean. A CPA who reviews the
 * doc-gen sidecar can then see WHY a form was generated even when no AI
 * decision was recorded.
 *
 * Distinct from AIDecisionRow on purpose. Engine derivations are pure
 * functions of state, need no grounding review, and update implicitly
 * when facts change. We expose them in case-state / sidecar output but do
 * not persist them as event rows. Design rationale: conversation
 * 2026-05-20 (separate from ai_decisions; `decidedBy` extends later).
 */
export interface EngineDerivation {
  /**
   * Who or what produced this derivation. Today always "engine". Reserved
   * for future "ai" | "cpa" | "user" values without consumer changes.
   */
  decidedBy: "engine";
  /** Plain-English rule that fired. CPA-readable. */
  rule: string;
  /** Fact keys the rule consumed. Empty when the rule only reads decisions. */
  triggeredByFactKeys: readonly string[];
  /** Decision keys the rule consumed. Empty when the rule only reads facts. */
  triggeredByDecisionKeys: readonly string[];
}

// ─── Result of evaluating a single derivation ────────────────────────────

export type DerivationResult<T> =
  | DerivationOk<T>
  | DerivationBlocked;

export interface DerivationOk<T> {
  ok: true;
  value: T;
  rationale: string;
  supportingFactKeys: string[];
  /** Set when the value came from an ai_decisions lookup. */
  decisionKey?: string;
}

export interface DerivationBlocked {
  ok: false;
  reason: string;
  /** Set when the block is "we need this decision recorded". */
  missingDecisionKey?: string;
  /** Set when the block is "we need these facts present". */
  missingFactKeys?: string[];
  /**
   * When true, this block is an engine gap: we have not built support for
   * this field yet (no example scenario, no fact ingestion path).
   * caseState filters unsupported results out of pendingDecisions /
   * pendingFacts, so Luca does not ask the user for input on fields we do
   * not compute yet. The `sum(...)` helper treats unsupported terms as 0,
   * so downstream sums continue without propagating the gap.
   */
  unsupported?: boolean;
}

export const ok = <T>(
  value: T,
  rationale: string,
  supportingFactKeys: string[],
  decisionKey?: string,
): DerivationOk<T> => ({ ok: true, value, rationale, supportingFactKeys, decisionKey });

export const blocked = (
  reason: string,
  opts: { decisionKey?: string; factKeys?: string[] } = {},
): DerivationBlocked => ({
  ok: false,
  reason,
  missingDecisionKey: opts.decisionKey,
  missingFactKeys: opts.factKeys,
});

/**
 * Build a result that marks the field as unsupported: an engine gap, not
 * a user-input gap. It surfaces as blocked everywhere a value is needed
 * (for example PDF rendering), but caseState skips it when it aggregates
 * pending questions for Luca.
 */
export const unsupported = (reason: string): DerivationBlocked => ({
  ok: false,
  reason,
  unsupported: true,
});

// ─── Context passed into every derivation ────────────────────────────────

export interface DerivationContext {
  taxYear: number;
  facts: FactsView;
  decisions: DecisionsView;
  /**
   * Resolved filing info: the typed view of facts + decisions that
   * `defineForm` bindings read via `info.X`. A stand-in for the planned
   * AI resolver layer. For now `resolveFilingInfo()` computes it by hand
   * before the engine runs.
   */
  filingInfo?: FilingInfo;
  /**
   * Cross-form / cross-field lookup hook. Returns the previously
   * evaluated result for a (formId, fieldId), or undefined when not yet
   * evaluated. Currently unused: the engine resolves cross-form reads
   * through EngineContext.fieldResult and the accessor proxy instead.
   */
  formValues?: (formId: string, fieldId: string) => DerivationResult<unknown> | undefined;
}

export interface FactsView {
  get(key: string): TaxFactRow | undefined;
  byKeyPrefix(prefix: string): TaxFactRow[];
  byCategory(category: string): TaxFactRow[];
  all(): TaxFactRow[];
}

export interface DecisionsView {
  get(key: string): AIDecisionRow | undefined;
  byKeyPrefix(prefix: string): AIDecisionRow[];
}

/*
 * ─── Category + value-type taxonomy used by every form field ─────────────
 *
 * Category is the user-facing bucket each field rolls up into for the
 * Filing Status panel. Every FormField declares one. TypeScript enforces
 * the declaration, so no field can be added without a classification.
 *
 * FieldValueType describes the shape of the field's value. It drives
 * rendering and, later, UI input semantics. A single-select reads from a
 * decision; a numeric reads from a numeric derivation; a text reads
 * straight from an identity fact.
 */

export type Category =
  | "personal_info"        // taxpayer name, SSN, address, DOB (form-header fields)
  | "filing_scope"         // filing status, residency, must-file decisions
  | "income"               // wages, dividends, capital gains, withholding
  | "deductions_credits"   // standard deduction, taxable income, tax, credits, payments
  | "other";

export type FieldValueType =
  | "numeric"
  | "single_select"
  | "multi_select"
  | "text"
  | "boolean"
  | "date";

/*
 * ─── Evaluated form / field shapes ───────────────────────────────────────
 *
 * Fields use a discriminated union. Each form declares its own field
 * kinds. Each kind carries a string `formFieldKind` tag and a value type
 * V. Consumers narrow by formFieldKind to get a strongly typed value with
 * no casts.
 *
 * Example shape per form:
 *   interface Form8949RowField extends BaseFormField<Form8949Row> {
 *     formFieldKind: "form-8949.row"; box: BoxId; rowIndex: number;
 *   }
 *   interface Form8949TotalsField extends BaseFormField<Form8949BoxTotals> {
 *     formFieldKind: "form-8949.totals"; box: BoxId;
 *   }
 *   type Form8949Field = Form8949RowField | Form8949TotalsField | …;
 *
 * Evaluating a form yields EvaluatedForm<TheirFieldUnion>.
 */

export interface BaseFormField<V = unknown> {
  fieldId: string;
  label: string;
  /** UI bucket this field belongs to (Filing Status panel rollup). */
  category: Category;
  /** Shape of the field's value. Informs rendering and input semantics. */
  valueType: FieldValueType;
  result: DerivationResult<V>;
}

/**
 * Loosest possible field shape. Generic engine code (for example a
 * registry of heterogeneous forms) gets this when the concrete form is
 * unknown. Specific consumers know the form's concrete field union and do
 * not see this type.
 */
export type AnyFormField = BaseFormField & { formFieldKind: string };

export interface EvaluatedForm<F extends BaseFormField = AnyFormField> {
  formId: string;
  jurisdiction: string;            // "federal" | "state-ca" | …
  title: string;
  taxYear: number;
  mustFile: DerivationResult<boolean>;
  /**
   * Audit trail for the must-file determination. Present when the
   * resolver populated it for this form (the five scope flags today).
   * Undefined for forms that do not go through resolveMustFile yet.
   */
  mustFileDerivation?: EngineDerivation;
  fields: F[];
}

export type FormEvaluator<F extends BaseFormField = AnyFormField> =
  (ctx: DerivationContext) => EvaluatedForm<F>;

// ─── In-memory view builders (used by tests and evaluateScenario) ────────

export function makeFactsView(rows: TaxFactRow[]): FactsView {
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return {
    get: (key) => byKey.get(key),
    byKeyPrefix: (prefix) => rows.filter((r) => r.key.startsWith(prefix)),
    byCategory: (category) => rows.filter((r) => r.category === category),
    all: () => rows,
  };
}

export function makeDecisionsView(rows: AIDecisionRow[]): DecisionsView {
  const byKey = new Map(rows.map((r) => [r.decisionKey, r]));
  return {
    get: (key) => byKey.get(key),
    byKeyPrefix: (prefix) => rows.filter((r) => r.decisionKey.startsWith(prefix)),
  };
}
