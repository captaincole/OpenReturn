/*
 * Form 982 arithmetic shared by Parts I and II: the constants and the inputs.
 * Amounts keep their cents; the printed lines round each total to the nearest
 * dollar (form.ts).
 */

import type { CanceledDebtKind } from "../../facts/index.js";

/*
 * Line 1e: "The maximum amount you can treat as qualified principal residence
 * indebtedness is $750,000 ($375,000 if married filing separately) after 2020
 * and before 2026" (irs-982-inst-2025::sec::line-1e::b02).
 */
export const PRINCIPAL_RESIDENCE_LIMIT = 750_000;
export const PRINCIPAL_RESIDENCE_LIMIT_SEPARATE = 375_000;

/*
 * A credit is reduced "331/3 cents per dollar" (irs-982-inst-2025::sec::purpose-of-form::b01,
 * line-7::b01), so one dollar of credit absorbs three dollars of excluded debt.
 * Part II lines hold the "amount excluded from gross income" applied
 * (irs-982-face-2025::sec::face-part-ii::b01), so lines 7, 8, 12 (the credit
 * part) and 13 can take up to 3 times the credit.
 */
export const EXCLUDED_DOLLARS_PER_CREDIT_DOLLAR = 3;

/* One canceled debt, after the facts are read (debts.ts). */
export interface DebtInput {
  key: string;
  /* The canceled debt that is income before any exclusion: the amount less the exceptions. */
  income: number;
  kind: CanceledDebtKind;
  title11Case: boolean;
  insolventBefore: boolean;
  residence?: {
    loanBalance: number;
    qualifiedPart: number;
    keepsHome: boolean;
    homeBasis?: number;
    excluded: boolean; // false when the taxpayer elects insolvency or the discharge is unrelated
  };
  realProperty?: {
    principalBeforeDischarge: number;
    propertyValue: number;
    otherQualifiedDebt: number;
  };
}

/* The tax attributes with every amount present (0 for none). */
export interface Attributes {
  netOperatingLoss: number;
  generalBusinessCredit: number;
  minimumTaxCredit: number;
  netCapitalLoss: number;
  passiveActivityLoss: number;
  passiveActivityCredit: number;
  foreignTaxCredit: number;
  depreciableBasis: number;
  realPropertyForSaleBasis: number;
  otherPropertyBasis: number;
  farmLandBasis: number;
  otherQualifiedPropertyBasis: number;
  depreciableRealPropertyBasis: number;
  moneyAfterDischarge: number;
  liabilitiesAfterDischarge: number;
  electedDepreciableBasisReduction: number;
  treatRealPropertyForSaleAsDepreciable: boolean;
}

export const NO_ATTRIBUTES: Attributes = {
  netOperatingLoss: 0,
  generalBusinessCredit: 0,
  minimumTaxCredit: 0,
  netCapitalLoss: 0,
  passiveActivityLoss: 0,
  passiveActivityCredit: 0,
  foreignTaxCredit: 0,
  depreciableBasis: 0,
  realPropertyForSaleBasis: 0,
  otherPropertyBasis: 0,
  farmLandBasis: 0,
  otherQualifiedPropertyBasis: 0,
  depreciableRealPropertyBasis: 0,
  moneyAfterDischarge: 0,
  liabilitiesAfterDischarge: 0,
  electedDepreciableBasisReduction: 0,
  treatRealPropertyForSaleAsDepreciable: false,
};

/* A non-negative amount; anything else is 0. */
export const amountOrZero = (value: number): number => (value > 0 ? value : 0);

/*
 * Apply an amount to a list of attributes in order, each up to what it has
 * ("The reduction must be made in the following order",
 * irs-982-inst-2025::sec::how-to-complete-the-form::b04). Returns the amount
 * each takes; the rest is what no attribute took.
 */
export function applyInOrder(
  amount: number,
  available: readonly number[],
): { taken: number[]; rest: number } {
  let rest = amountOrZero(amount);
  const taken = available.map((each) => {
    const used = Math.min(rest, amountOrZero(each));
    rest -= used;
    return used;
  });
  return { taken, rest };
}

/* Insolvency Worksheet line 38: liabilities less assets; 0 or less is not insolvent (part-iii::b01). */
export function insolvencyAmount(totalLiabilities: number, totalAssetsValue: number): number {
  return amountOrZero(totalLiabilities - totalAssetsValue);
}

/* The qualified-principal-residence cap for the filing status (line-1e::b02). */
export function principalResidenceLimit(marriedFilingSeparately: boolean): number {
  return marriedFilingSeparately ? PRINCIPAL_RESIDENCE_LIMIT_SEPARATE : PRINCIPAL_RESIDENCE_LIMIT;
}
