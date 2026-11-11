import { tcbCa005Facts } from "../../engine/tests/scenarios/tcb-ca-005/facts";
import { latestFacts } from "./appDb";

/* The parts of /app/state's deductions view the checks read (web/lib/deductions.ts). */
export interface DeductionsState {
  next: { step: string; why?: string; questions?: Array<{ ask: string }>; done?: string };
  comparison: {
    federal: { itemized: number; standard: number } | null;
    ca: { itemized: number; standard: number } | null;
  };
  items: Array<{ id: string; assumed: boolean }>;
  namedExpenses: Array<{ words: string; outcome: string | null }>;
  recordedDecisions: { itemizeOrStandard: unknown };
  summary: string | null;
}

const DOCUMENT_CATEGORIES = ["wages", "investment_income", "retirement"];

/* The numbers a document prints: its top-level number fields. */
const numbersOf = (value: unknown): Array<[string, number]> =>
  Object.entries((value ?? {}) as Record<string, unknown>).filter(
    (entry): entry is [string, number] => typeof entry[1] === "number",
  );

const label = (key: string, value: unknown) => {
  const { payerName, employerName } = value as { payerName?: string; employerName?: string };
  return payerName ?? employerName ?? key;
};

/*
 * Each document fact of the scenario against the stored fact of the same
 * category that differs least: Cade names the keys, so they can differ.
 */
export function documentProblems(): string[] {
  const stored = [...latestFacts().values()];
  return tcbCa005Facts
    .filter((fact) => DOCUMENT_CATEGORIES.includes(fact.category))
    .filter((fact) => typeof fact.value === "object" && fact.value !== null)
    .flatMap((fact) => {
      const want = numbersOf(fact.value);
      const diffs = stored
        .filter((row) => row.category === fact.category)
        .map((row) => {
          const got = new Map(numbersOf(row.value));
          return want
            .filter(([box, amount]) => got.get(box) !== amount)
            .map(([box, amount]) => `${box} want ${amount}, got ${got.get(box) ?? "(missing)"}`);
        })
        .sort((left, right) => left.length - right.length);
      const best = diffs[0];
      if (!best) return [`${label(fact.key, fact.value)}: no fact stored`];
      return best.length === 0 ? [] : [`${label(fact.key, fact.value)}: ${best.join(", ")}`];
    });
}

/* The amounts the deductions conversation asks, as the scenario holds them. */
const DEDUCTION_KEYS = [
  "mortgage.interest_form_1098",
  "mortgage.outstanding_principal_form_1098",
  "mortgage.origination_date_form_1098",
  "state_local_tax.real_estate",
  "charitable.cash",
  "charitable.noncash",
  "medical.expenses_total",
  "investment_interest.expense_paid",
  "investment_interest.disallowed_carryover",
  "investment_interest.elected_qualified_dividends_and_gain",
  "investment_interest.investment_expenses",
  "investment_interest.ca_disallowed_carryover",
];

export function deductionFactProblems(): string[] {
  const stored = latestFacts();
  return DEDUCTION_KEYS.flatMap((key) => {
    const want = tcbCa005Facts.find((fact) => fact.key === key)?.value;
    const got = stored.get(key)?.value;
    return got === want ? [] : [`${key}: want ${want}, got ${got ?? "(missing)"}`];
  });
}

/* The scenario's totals (tcb-ca-005's expected.ts and the Madison closing test). */
const COMPARISON = {
  federal: { itemized: 49940, standard: 31500 },
  ca: { itemized: 41859, standard: 11412 },
};

export function closingProblems(view: DeductionsState): string[] {
  const sides = (["federal", "ca"] as const).flatMap((side) => {
    const got = view.comparison[side];
    const want = COMPARISON[side];
    if (got?.itemized === want.itemized && got.standard === want.standard) return [];
    return [`${side}: want ${want.itemized} against ${want.standard}, got ${JSON.stringify(got)}`];
  });
  const assumed = view.items.filter((item) => item.assumed).map((item) => `${item.id} assumed`);
  const decision = view.recordedDecisions.itemizeOrStandard;
  return [
    ...(view.next.step === "closed" ? [] : [`step ${view.next.step}, not closed`]),
    ...sides,
    ...assumed,
    ...(decision === "itemized" ? [] : [`itemize_vs_standard: got ${JSON.stringify(decision)}`]),
  ];
}

export function namedExpenseProblems(view: DeductionsState): string[] {
  const named = view.namedExpenses.find((expense) => /student loan/i.test(expense.words));
  if (!named) return ["no named expense for student loan interest"];
  return named.outcome === "counts_elsewhere"
    ? []
    : [`student loan interest: want counts_elsewhere, got ${named.outcome}`];
}
