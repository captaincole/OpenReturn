/*
 * The deductions module's entry point: each catalog branch's state for this
 * filer, and the itemized-or-standard comparison. It reads the same facts and
 * filing info the forms read, and the evaluated forms where a form applies a
 * limit (Form 4952, FTB 3526), so exact amounts are the forms' amounts. Its
 * only output back into the return is the recommendation Cade records as
 * decisions.itemize_vs_standard.
 */

import { lookupStandardDeduction } from "../data/standardDeduction.js";
import { MORTGAGE_KEYS } from "../facts/index.js";
import { standardDeduction } from "../federal/1040/deductions.js";
import type { FilingInfo } from "../filingInfo.js";
import { sumOrBlank } from "../money.js";
import type { AnyFormField, EvaluatedForm } from "../types.js";
import { branchState, type BranchState } from "./branches.js";
import { DEDUCTION_BRANCHES, type BranchId, type DeductionBranch } from "./catalog.js";
import { compareDeductions, type Amounts, type DeductionsComparison } from "./compare.js";

export interface DeductionsInput {
  facts: ReadonlyArray<{ key: string; value: unknown }>;
  filingInfo: FilingInfo;
  forms: ReadonlyMap<string, EvaluatedForm<AnyFormField>>;
  /** Rough amounts per branch, stated before the documents (the facts flagged as estimates, #92). */
  estimates?: Amounts;
}

export interface DeductionsSummary {
  branches: BranchState[];
  /** Undefined until AGI, the filing status and the standard deduction are known. */
  comparison?: DeductionsComparison;
}

type Forms = DeductionsInput["forms"];

/* An evaluated line's number, by its full field id ("schedule-a.0.line.17_…"). */
function evaluatedNumber(forms: Forms, fieldId: string): number | undefined {
  const formId = fieldId.slice(0, fieldId.indexOf("."));
  const field = forms.get(formId)?.fields.find((candidate) => candidate.fieldId === fieldId);
  if (!field?.result.ok) return undefined;
  return typeof field.result.value === "number" ? field.result.value : undefined;
}

const files = (info: FilingInfo, formId: string) => info.mustFile?.[formId]?.value === true;

/* The amount each branch's form line will use, from exact facts; undefined while open. */
function exactAmount(id: BranchId, info: FilingInfo, forms: Forms): number | undefined {
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
      if (files(info, "form-4952")) {
        return evaluatedNumber(forms, "form-4952.0.line.8_investment_interest_deduction");
      }
      return info.noFormException === true ? info.investmentInterestPaid : undefined;
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

/* The principal is asked only with a 1098's interest; the date only between the two limits. */
function missingFor(
  branch: DeductionBranch,
  info: FilingInfo,
  stated: Map<string, unknown>,
): string[] {
  const missing = branch.amountKeys.filter((key) => !stated.has(key));
  if (branch.id !== "mortgage_interest") return missing;
  const asked = info.missingInputs?.["schedule-a"] ?? [];
  const principalNeeded = stated.has(MORTGAGE_KEYS.interestForm1098);
  return [
    ...missing.filter(
      (key) => key !== MORTGAGE_KEYS.outstandingPrincipalForm1098 || principalNeeded,
    ),
    ...(asked.includes(MORTGAGE_KEYS.originationDateForm1098)
      ? [MORTGAGE_KEYS.originationDateForm1098]
      : []),
  ];
}

function stateOf(
  branch: DeductionBranch,
  input: DeductionsInput,
  stated: Map<string, unknown>,
  agi: number | undefined,
): BranchState {
  const { filingInfo: info, forms } = input;
  // A document or amount that arrives early opens the branch: the probe question is then moot.
  const opened = branch.amountKeys.some((key) => stated.has(key));
  const answer = branch.opensWith === undefined ? undefined : stated.get(branch.opensWith);
  const opener = opened ? true : answer;
  const forCpa = branch.id === "mortgage_interest" && mortgageForCpa(info, stated);
  const statedInterest = stated.get(MORTGAGE_KEYS.interestForm1098);
  const estimate =
    input.estimates?.[branch.id] ??
    (forCpa && typeof statedInterest === "number" ? statedInterest : undefined);
  return branchState(branch, {
    opener: typeof opener === "boolean" ? opener : undefined,
    exact: forCpa ? undefined : exactAmount(branch.id, info, forms),
    estimate,
    forCpa,
    missingAmountKeys: missingFor(branch, info, stated),
    agi,
    filesCa: files(info, "form-540"),
  });
}

export function evaluateDeductions(input: DeductionsInput): DeductionsSummary {
  const { filingInfo: info, forms } = input;
  const stated = new Map(input.facts.map((fact) => [fact.key, fact.value]));
  const agi = evaluatedNumber(forms, "form-1040.line.11b");
  const branches = DEDUCTION_BRANCHES.map((branch) => stateOf(branch, input, stated, agi));
  const federalStandard = standardDeduction(info);
  if (agi === undefined || !info.filingStatus || federalStandard === undefined) return { branches };
  const amounts: Amounts = {};
  const estimated = new Set<BranchId>();
  for (const state of branches) {
    if (state.amount === undefined) continue;
    amounts[state.id] = state.amount;
    if (state.status === "estimate" || state.status === "for_cpa") estimated.add(state.id);
    if (state.status === "below_floor" && input.estimates?.[state.id] !== undefined)
      estimated.add(state.id);
  }
  const comparison = compareDeductions({
    amounts,
    estimated,
    agi,
    filingStatus: info.filingStatus,
    federalStandard,
    caStandard: files(info, "form-540")
      ? lookupStandardDeduction("state-ca", 2025, info.filingStatus)
      : undefined,
    caInvestmentInterest: files(info, "form-3526")
      ? evaluatedNumber(forms, "form-3526.0.line.8_investment_interest_deduction")
      : undefined,
  });
  return { branches, comparison };
}
