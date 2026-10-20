/*
 * Filing Status panel rollup. Walks the evaluated forms, groups every
 * field by its `category`, and tallies complete vs. pending.
 *
 * A form contributes its fields only when `mustFile` is ok and true.
 * Forms the taxpayer does not need simply do not appear in the rollup.
 * Forms with a blocked mustFile (filing requirement still unknown) also
 * contribute no fields, but their must-file blocker still surfaces via
 * pendingDecisions on the case state.
 */

import type { AnyFormField, BaseFormField, Category, EvaluatedForm } from "../types.js";

export const CATEGORIES: readonly Category[] = [
  "personal_info",
  "filing_scope",
  "income",
  "deductions_credits",
  "other",
] as const;

const CATEGORY_LABEL: Record<Category, string> = {
  personal_info: "Personal Info",
  filing_scope: "Filing Scope",
  income: "Income",
  deductions_credits: "Deductions & Credits",
  other: "Other",
};

export interface FilingStatusItem {
  /** Stable id: the field's `fieldId`. */
  id: string;
  /**
   * Form this item belongs to, for example "form-1040". Empty when the
   * item is not tied to a specific form. No such cases exist today; the
   * option stays for future expansion.
   */
  formId: string;
  label: string;
  state: "complete" | "pending";
  /** When pending, why. Typically the field's blocked reason. */
  reason?: string;
  /** When pending, the decision/fact keys the engine is waiting on. */
  missingDecisionKey?: string;
  missingFactKeys?: string[];
}

export interface FilingStatusCategory {
  id: Category;
  label: string;
  /** Total items the rollup considered for this category. */
  total: number;
  /** Items in `complete` state. completed/total drives the bar fill. */
  completed: number;
  items: FilingStatusItem[];
}

export interface FilingStatus {
  overallPct: number;
  categories: FilingStatusCategory[];
}

/**
 * Produce the FilingStatus tree from a set of evaluated forms.
 *
 * Forms whose mustFile is blocked or false are skipped. Their fields do
 * not count toward any category total. That keeps the bar honest about
 * the work actually in progress.
 */
export function categorizeFormProgress(
  forms: readonly EvaluatedForm<AnyFormField>[],
): FilingStatus {
  const buckets: Record<Category, FilingStatusItem[]> = {
    personal_info: [],
    filing_scope: [],
    income: [],
    deductions_credits: [],
    other: [],
  };

  for (const form of forms) {
    if (!form.mustFile.ok || form.mustFile.value !== true) continue;
    for (const field of form.fields) {
      buckets[field.category].push(toItem(form.formId, field));
    }
  }

  const categories: FilingStatusCategory[] = CATEGORIES.map((id) => {
    const items = buckets[id];
    const completed = items.filter((i) => i.state === "complete").length;
    return {
      id,
      label: CATEGORY_LABEL[id],
      total: items.length,
      completed,
      items,
    };
  });

  const totalAll = categories.reduce((s, c) => s + c.total, 0);
  const completedAll = categories.reduce((s, c) => s + c.completed, 0);
  // eslint-disable-next-line no-restricted-properties -- a progress percent, not money
  const overallPct = totalAll === 0 ? 0 : Math.round((completedAll / totalAll) * 100);

  return { overallPct, categories };
}

function toItem(formId: string, field: BaseFormField): FilingStatusItem {
  if (field.result.ok) {
    return {
      id: field.fieldId,
      formId,
      label: field.label,
      state: "complete",
    };
  }
  return {
    id: field.fieldId,
    formId,
    label: field.label,
    state: "pending",
    reason: field.result.reason,
    missingDecisionKey: field.result.missingDecisionKey,
    missingFactKeys: field.result.missingFactKeys,
  };
}
