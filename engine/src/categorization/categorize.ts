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
  id: string;
  formId: string;
  label: string;
  state: "complete" | "pending";
  reason?: string;
  missingDecisionKey?: string;
  missingFactKeys?: string[];
}

export interface FilingStatusCategory {
  id: Category;
  label: string;
  total: number;
  completed: number;
  items: FilingStatusItem[];
}

export interface FilingStatus {
  overallPct: number;
  categories: FilingStatusCategory[];
}

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
