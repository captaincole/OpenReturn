/*
 * The deductions module's entry point: each catalog item's state for this
 * filer, and the itemized-or-standard comparison. Both read a pass of the
 * forms as if the return itemizes (whatIf.ts), so every amount is the forms'
 * amount. Its only output back into the return is the recommendation Cade
 * records as decisions.itemize_vs_standard.
 */

import { lookupStandardDeduction } from "../data/standardDeduction.js";
import type { FormsPass } from "../evaluateForms.js";
import { MORTGAGE_KEYS } from "../facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../facts/rows.js";
import { standardDeduction } from "../federal/1040/deductions.js";
import type { FilingInfo } from "../filingInfo.js";
import { sumOrBlank } from "../money.js";
import { DEDUCTION_ITEMS, type DeductionItem, type ItemId } from "./catalog.js";
import { compareDeductions, type DeductionsComparison, type Totals } from "./compare.js";
import { countingLines, itemState, type ItemState } from "./items.js";
import { itemizedRun, type Changes, type ItemizedRun } from "./whatIf.js";

export interface DeductionsInput {
  taxYear: number;
  /** The facts and the assumptions in use, one row per key, as the forms read them. */
  facts: TaxFactRow[];
  /** The keys an assumption fills. */
  assumedKeys: ReadonlySet<string>;
  /** One row per key. */
  decisions: AIDecisionRow[];
}

export interface DeductionsSummary {
  items: ItemState[];
  /** Undefined until AGI, the filing status and the standard deduction are known. */
  comparison?: DeductionsComparison;
}

type Forms = FormsPass["forms"];

/* An evaluated line's number, by its full field id ("schedule-a.0.line.17_…"). */
function evaluatedNumber(forms: Forms, fieldId: string): number | undefined {
  const formId = fieldId.slice(0, fieldId.indexOf("."));
  const field = forms.get(formId)?.fields.find((candidate) => candidate.fieldId === fieldId);
  if (!field?.result.ok) return undefined;
  return typeof field.result.value === "number" ? field.result.value : undefined;
}

const files = (info: FilingInfo, formId: string) => info.mustFile?.[formId]?.value === true;

/* The amount each item's form line will use; undefined while open. */
function lineAmount(id: ItemId, info: FilingInfo, forms: Forms): number | undefined {
  switch (id) {
    case "state_income_tax":
      return info.stateLocalIncomeTaxPaid;
    case "real_estate_tax":
      return info.realEstateTaxes;
    case "personal_property_tax":
      return info.personalPropertyTaxes;
    case "mortgage_interest":
      return info.mortgageInterestWaits
        ? undefined
        : sumOrBlank(
            info.mortgageInterestForm1098,
            info.mortgageInterestNotForm1098,
            info.pointsNotForm1098,
          );
    case "investment_interest":
      return investmentInterest(info, forms);
    case "gifts_cash":
      return info.giftsCashCheck;
    case "gifts_property":
      return info.giftsOtherThanCash;
    case "gift_carryover":
      return info.giftsCarryover;
    case "medical":
      return info.medicalDentalExpenses;
    case "ca_investment_fees":
      return info.caInvestmentFees;
  }
}
/* A form's own answers while it files: its lines wait on them. */
const asksOf = (info: FilingInfo, formId: string): readonly string[] =>
  files(info, formId) ? (info.missingInputs?.[formId] ?? []) : [];

/*
 * The item's answers on both returns: Form 4952's (the election, other
 * expenses) and FTB 3526's (California's own carryover).
 */
const investmentInterestAsks = (info: FilingInfo): string[] => [
  ...new Set([...asksOf(info, "form-4952"), ...asksOf(info, "form-3526")]),
];

/*
 * Schedule A line 9: Form 4952 line 8 when the form files and has its
 * answers, the interest paid under its no-file exception, and nothing when no
 * expense or carryover is stated above 0 (the item then closes instead of
 * staying open).
 */
function investmentInterest(info: FilingInfo, forms: Forms): number | undefined {
  if (files(info, "form-4952")) {
    if (investmentInterestAsks(info).length > 0) return undefined;
    return evaluatedNumber(forms, "form-4952.0.line.8_investment_interest_deduction");
  }
  if (info.noFormException === true) return info.investmentInterestPaid;
  const paid = info.investmentInterestPaid;
  const carryover = info.disallowedInterestCarryover;
  if (paid === undefined || carryover === undefined) return undefined;
  return paid <= 0 && carryover <= 0 ? 0 : undefined;
}

/*
 * A 1098 over the acquisition-debt limit is for the CPA (Pub. 936 is not
 * modeled); one still missing its principal or date is open, with those keys.
 */
function mortgageForCpa(info: FilingInfo, stated: Map<string, unknown>): boolean {
  if (!info.mortgageInterestWaits) return false;
  const asked = info.missingInputs?.["schedule-a"] ?? [];
  const pending = [
    MORTGAGE_KEYS.outstandingPrincipalForm1098,
    MORTGAGE_KEYS.originationDateForm1098,
  ];
  return (
    stated.has(MORTGAGE_KEYS.outstandingPrincipalForm1098) &&
    !pending.some((key) => asked.includes(key))
  );
}

/*
 * The keys with no fact or assumption, and the keys an assumption fills. The
 * principal is asked only with a 1098's interest; the date only between the
 * two limits.
 */
function missingFor(
  item: DeductionItem,
  input: DeductionsInput,
  info: FilingInfo,
  stated: Map<string, unknown>,
) {
  const assumed = item.amountKeys.filter((key) => input.assumedKeys.has(key));
  return [...new Set([...unstated(item, info, stated), ...assumed])];
}

function unstated(item: DeductionItem, info: FilingInfo, stated: Map<string, unknown>): string[] {
  const missing = item.amountKeys.filter((key) => !stated.has(key));
  if (item.id === "investment_interest") {
    return [...new Set([...missing, ...investmentInterestAsks(info)])];
  }
  if (item.id !== "mortgage_interest") return missing;
  const asked = info.missingInputs?.["schedule-a"] ?? [];
  // As the Schedule A resolver asks: only with a 1098 interest above 0.
  const interest = stated.get(MORTGAGE_KEYS.interestForm1098);
  const principalNeeded = typeof interest === "number" && interest > 0;
  return [
    ...missing.filter(
      (key) => key !== MORTGAGE_KEYS.outstandingPrincipalForm1098 || principalNeeded,
    ),
    ...(asked.includes(MORTGAGE_KEYS.originationDateForm1098)
      ? [MORTGAGE_KEYS.originationDateForm1098]
      : []),
  ];
}

/* On every return the item counts on, its net line is 0: the amount is under the AGI floor. */
function belowFloor(item: DeductionItem, pass: FormsPass): boolean {
  const lines = countingLines(item, files(pass.filingInfo, "form-540"));
  return (
    lines.length > 0 &&
    lines.every(
      (line) => line.netLine !== undefined && evaluatedNumber(pass.forms, line.netLine) === 0,
    )
  );
}

function stateOf(
  item: DeductionItem,
  input: DeductionsInput,
  stated: Map<string, unknown>,
  pass: FormsPass,
): ItemState {
  const { filingInfo: info, forms } = pass;
  const forCpa = item.id === "mortgage_interest" && mortgageForCpa(info, stated);
  const statedInterest = stated.get(MORTGAGE_KEYS.interestForm1098);
  return itemState(item, {
    amount: forCpa ? undefined : lineAmount(item.id, info, forms),
    assumed: item.amountKeys.some((key) => input.assumedKeys.has(key)),
    anyStated: item.amountKeys.some((key) => stated.has(key)),
    forCpa,
    upperBound: forCpa && typeof statedInterest === "number" ? statedInterest : undefined,
    missingAmountKeys: missingFor(item, input, info, stated),
    belowFloor: belowFloor(item, pass),
    filesCa: files(info, "form-540"),
  });
}

const FEDERAL_TOTAL = "schedule-a.0.line.17_total_itemized_deductions";
const CA_TOTAL = "schedule-ca.5.page2.total_itemized_29";

const totalsOf = (pass: FormsPass): Totals => ({
  federal: evaluatedNumber(pass.forms, FEDERAL_TOTAL),
  ca: files(pass.filingInfo, "form-540") ? evaluatedNumber(pass.forms, CA_TOTAL) : undefined,
});

const itemById = (id: ItemId) => DEDUCTION_ITEMS.find((item) => item.id === id)!;

/*
 * The keys that can still change: each assumed amount key, or for the CPA the
 * 1098's interest (the upper bound).
 */
export function unsettledKeys(state: ItemState, assumedKeys: ReadonlySet<string>): string[] {
  const keys = itemById(state.id).amountKeys;
  if (state.status === "for_cpa") return keys.slice(0, 1);
  return keys.filter((key) => assumedKeys.has(key));
}

/* Each unsettled key is set to 0 and to double, and the forms run again. */
function whatIfs(
  items: ItemState[],
  stated: Map<string, unknown>,
  assumedKeys: ReadonlySet<string>,
  run: ItemizedRun,
  bound: Changes,
) {
  return items
    .filter((state) => state.amount !== undefined)
    .map((state) => {
      const totals = unsettledKeys(state, assumedKeys).flatMap((key) => {
        const value = stated.get(key);
        if (typeof value !== "number") return [];
        return [0, 2 * value].map((changed) => totalsOf(run({ ...bound, [key]: changed })));
      });
      return { id: state.id, totals };
    })
    .filter((whatIf) => whatIf.totals.length > 0);
}

function comparisonOf(
  items: ItemState[],
  stated: Map<string, unknown>,
  assumedKeys: ReadonlySet<string>,
  pass: FormsPass,
  run: ItemizedRun,
): DeductionsComparison | undefined {
  const info = pass.filingInfo;
  const agi = evaluatedNumber(pass.forms, "form-1040.line.11b");
  const federalStandard = standardDeduction(info);
  if (agi === undefined || !info.filingStatus || federalStandard === undefined) return undefined;
  /*
   * A loan over the debt limit leaves line 17 blank until the CPA figures it.
   * The comparison counts the 1098's full interest, the most the line can be:
   * it runs the forms with the principal under the limit.
   */
  const bound: Changes = items.some((state) => state.status === "for_cpa")
    ? { [MORTGAGE_KEYS.outstandingPrincipalForm1098]: 0 }
    : {};
  const comparison = compareDeductions({
    totals: totalsOf(Object.keys(bound).length > 0 ? run(bound) : pass),
    standards: {
      federal: federalStandard,
      ca: files(info, "form-540")
        ? lookupStandardDeduction("state-ca", 2025, info.filingStatus)
        : undefined,
    },
    whatIfs: whatIfs(items, stated, assumedKeys, run, bound),
  });
  return comparison.federal || comparison.ca ? comparison : undefined;
}

export function evaluateDeductions(input: DeductionsInput): DeductionsSummary {
  const run = itemizedRun(input.taxYear, input.facts, input.decisions);
  const pass = run();
  const stated = new Map(input.facts.map((fact) => [fact.key, fact.value]));
  const items = DEDUCTION_ITEMS.map((item) => stateOf(item, input, stated, pass));
  const comparison = comparisonOf(items, stated, input.assumedKeys, pass, run);
  return comparison ? { items, comparison } : { items };
}
