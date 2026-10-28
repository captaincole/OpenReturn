/*
 * Pure aggregation (sums, math, table lookups) lives in code. A
 * classification or judgment ALWAYS reads an ai_decisions row, even when
 * the answer is obvious.
 */

import type { AIDecisionRow, TaxFactRow } from "./facts/rows.js";
import type { FilingInfo } from "./filingInfo.js";

export interface EngineDerivation {
  decidedBy: "engine";
  rule: string;
  triggeredByFactKeys: readonly string[];
  triggeredByDecisionKeys: readonly string[];
}

export type DerivationResult<T> = DerivationOk<T> | DerivationBlocked;

export interface DerivationOk<T> {
  ok: true;
  value: T;
  rationale: string;
  supportingFactKeys: string[];
  decisionKey?: string;
}

export interface DerivationBlocked {
  ok: false;
  reason: string;
  missingDecisionKey?: string;
  missingFactKeys?: string[];
  /** An engine gap: Cade does not ask the user, and sum() counts it as 0. */
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

export const unsupported = (reason: string): DerivationBlocked => ({
  ok: false,
  reason,
  unsupported: true,
});

export interface DerivationContext {
  taxYear: number;
  facts: FactsView;
  decisions: DecisionsView;
  filingInfo?: FilingInfo;
  /** Unused: cross-form reads go through EngineContext.fieldResult. */
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

export type Category =
  | "personal_info" // taxpayer name, SSN, address, DOB (form-header fields)
  | "filing_scope" // filing status, residency, must-file decisions
  | "income" // wages, dividends, capital gains, withholding
  | "deductions_credits" // standard deduction, taxable income, tax, credits, payments
  | "other";

export type FieldValueType =
  "numeric" | "single_select" | "multi_select" | "text" | "boolean" | "date";

export interface BaseFormField<V = unknown> {
  fieldId: string;
  label: string;
  category: Category;
  valueType: FieldValueType;
  result: DerivationResult<V>;
  reads?: string[];
}

export type AnyFormField = BaseFormField & { formFieldKind: string };

export interface EvaluatedForm<F extends BaseFormField = AnyFormField> {
  formId: string;
  jurisdiction: string; // "federal" | "state-ca" | …
  title: string;
  taxYear: number;
  mustFile: DerivationResult<boolean>;
  mustFileDerivation?: EngineDerivation;
  missingInputs: string[];
  fields: F[];
}

export type FormEvaluator<F extends BaseFormField = AnyFormField> = (
  ctx: DerivationContext,
) => EvaluatedForm<F>;

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
