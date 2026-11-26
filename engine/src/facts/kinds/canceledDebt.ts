/*
 * Canceled debt (Form 982 and Schedule 1 line 8c). Three kinds of fact:
 *
 * 1. Form 1099-C, Cancellation of Debt (Rev. April 2025): the creditor's report,
 *    one fact per form, the boxes as printed. A document.
 * 2. The answers about one canceled debt (CanceledDebtFactValue): what the debt
 *    was for and which exclusion of section 108 applies. One fact per debt,
 *    with or without a Form 1099-C ("Even if you didn't receive a Form 1099-C,
 *    you must report canceled debt", irs-pub-4681-2025::sec::postal-service-or-the-postal-rate::b04).
 * 3. Two answers for the whole return: the Insolvency Worksheet totals
 *    (irs-pub-4681-2025::sec::part-i::b01, part-iii::b01) and the tax attributes
 *    that Form 982 Part II reduces.
 */

type FactRow = { key: string; value: unknown; category: string };

/* Form 1099-C boxes. Box 2 is the amount of debt discharged. */
export interface Form1099CFactValue {
  creditorName: string;
  creditorTin?: string;
  box1?: string; // Date of identifiable event, YYYY-MM-DD
  box2: number; // Amount of debt discharged
  box3?: number; // Interest, if included in box 2
  box4?: string; // Debt description
  box5?: boolean; // The debtor was personally liable for repayment of the debt
  box6?: string; // Identifiable event code, A to H
  box7?: number; // Fair market value of property
}

/*
 * What the canceled debt was. The taxable part of a "personal" or
 * "principal_residence" debt goes on Schedule 1 line 8c; the taxable part of a
 * business, rental or farm debt goes on Schedule C, E or F or Form 4835
 * (irs-pub-4681-2025::sec::general-rules::b03).
 * - personal: a nonbusiness debt (a credit card, a car loan, a personal loan).
 * - principal_residence: a mortgage that may be qualified principal residence
 *   indebtedness (irs-982-inst-2025::sec::line-1e::b01).
 * - farm: qualified farm indebtedness: incurred directly in farming, 50% or more
 *   of the gross receipts of 2022 to 2024 from farming, canceled by a qualified
 *   person (irs-982-inst-2025::sec::line-1c::b01).
 * - real_property_business: qualified real property business indebtedness that
 *   the taxpayer elects to exclude (irs-982-inst-2025::sec::line-1d::b01).
 * - other_business: any other business or rental debt.
 */
export type CanceledDebtKind =
  "personal" | "principal_residence" | "farm" | "real_property_business" | "other_business";

/* Line 1e answers for a mortgage on the main home (irs-982-inst-2025::sec::line-1e::b01–b03). */
export interface PrincipalResidenceDebt {
  /* The loan's outstanding principal immediately before the discharge. */
  loanBalance: number;
  /*
   * The part of that loan that is qualified principal residence indebtedness:
   * the debt to buy, build or substantially improve the main home, not more
   * than its cost plus improvements, and refinanced debt only up to the old
   * principal (line-1e::b02).
   */
  qualifiedPart: number;
  /* The taxpayer still owns the home after the discharge (line 10b). */
  keepsHome: boolean;
  /* The basis of the main home, cost plus improvements (line 10b). Needed when keepsHome. */
  homeBasis?: number;
  /* The taxpayer elects the insolvency exclusion instead of line 1e (line-1b::b01). */
  electsInsolvencyInstead?: boolean;
  /*
   * The discharge was for services performed for the lender or another reason
   * not directly related to a decline in the home's value or to the taxpayer's
   * financial condition: line 1e does not apply (line-1e::b03).
   */
  unrelatedToDeclineOrFinancialCondition?: boolean;
}

/* Line 1d answers (irs-982-inst-2025::sec::line-1d::b02). */
export interface RealPropertyBusinessDebt {
  /* The debt's outstanding principal immediately before the discharge. */
  principalBeforeDischarge: number;
  /* The fair market value of the real property securing the debt, at that time. */
  propertyValue: number;
  /* Other qualified real property business debt secured by that property, at that time. */
  otherQualifiedDebt?: number;
}

export interface CanceledDebtFactValue {
  /* The Form 1099-C fact for this debt, when one came. */
  form1099CKey?: string;
  /*
   * The canceled debt that is the taxpayer's. With a Form 1099-C, only when it
   * differs from box 2 (a debt shared with a person who files another return,
   * irs-pub-4681-2025::sec::postal-service-or-the-postal-rate::b05); with no
   * form, the amount canceled.
   */
  amount?: number;
  /* The date of the cancellation, YYYY-MM-DD, when no Form 1099-C gives it in box 1. */
  date?: string;
  /*
   * The part that is not income under an exception of Pub. 4681 (a gift, a
   * deductible debt, a price reduction, a student loan exception). Absent: none.
   */
  notIncome?: number;
  kind: CanceledDebtKind;
  /*
   * The taxpayer was personally liable for the debt (recourse debt). Absent: the
   * Form 1099-C box 5 answer, and with no form, liable. "If you aren't
   * personally liable for the debt, you don't have ordinary income from the
   * cancellation of debt unless you retain the collateral" with a discount for
   * early payment or a principal reduction (irs-pub-4681-2025::sec::general-rules::b01).
   */
  personallyLiable?: boolean;
  /*
   * For a debt the taxpayer was not liable for: the taxpayer keeps the property
   * that secures it. A principal_residence debt answers with keepsHome instead.
   * Not kept (a foreclosure, a repossession, an abandonment): the whole debt is
   * an amount realized on the disposition, a sale on its own form, and none of
   * it is canceled debt income (sales-or-other-dispositions::b02, ::b03).
   */
  keepsCollateral?: boolean;
  /* The discharge was granted in, or under a plan approved in, a title 11 case (line 1a). */
  title11Case: boolean;
  /* The taxpayer was insolvent immediately before this cancellation (line 1b). */
  insolventBefore: boolean;
  principalResidence?: PrincipalResidenceDebt;
  realPropertyBusiness?: RealPropertyBusinessDebt;
}

/* Insolvency Worksheet lines 15 and 37, immediately before the cancellation. */
export interface InsolvencyFactValue {
  totalLiabilities: number;
  totalAssetsValue: number;
}

/*
 * The tax attributes Form 982 Part II reduces, as they stand after the 2025
 * tax is figured ("Reduce your tax attributes after you figure your income tax
 * liability for 2025", irs-pub-4681-2025::sec::bankruptcy-and-insolvency::b05).
 * Each amount absent means none.
 */
export interface TaxAttributesFactValue {
  /* The 2025 NOL and the NOL carried to 2025 that 2025 did not use (line 6). */
  netOperatingLoss?: number;
  /* The general business credit carried to or from 2025 (line 7). */
  generalBusinessCredit?: number;
  /* The minimum tax credit available at the beginning of 2026 (line 8). */
  minimumTaxCredit?: number;
  /* The 2025 net capital loss and the capital loss carried to 2025 that 2025 did not use (line 9). */
  netCapitalLoss?: number;
  /* The passive activity loss carried over from 2025 (line 12). */
  passiveActivityLoss?: number;
  /* The passive activity credit carried over from 2025 (line 12). */
  passiveActivityCredit?: number;
  /* The foreign tax credit carried to or from 2025 (line 13). */
  foreignTaxCredit?: number;
  /*
   * Basis of the property held at the beginning of 2026, in three parts that do
   * not overlap: depreciable property; real property held for sale to customers
   * (line 3); and all other property (land, stock, personal-use property such as
   * the home, its basis before any line 10b reduction).
   */
  depreciableBasis?: number;
  realPropertyForSaleBasis?: number;
  otherPropertyBasis?: number;
  /* Parts of otherPropertyBasis: land used in farming (line 11b), other business or investment property (line 11c). */
  farmLandBasis?: number;
  otherQualifiedPropertyBasis?: number;
  /* Part of depreciableBasis: depreciable real property held immediately before the discharge (line 1d limit). */
  depreciableRealPropertyBasis?: number;
  /* Money held and all liabilities, immediately after the discharge (line 10a limit). */
  moneyAfterDischarge?: number;
  liabilitiesAfterDischarge?: number;
  /* Line 5: the amount the taxpayer elects under section 108(b)(5) to apply first to depreciable basis. */
  electedDepreciableBasisReduction?: number;
  /* Line 3: the section 1017(b)(3)(E) election to treat real property held for sale as depreciable. */
  treatRealPropertyForSaleAsDepreciable?: boolean;
}

const CANCELED_DEBT_CATEGORY = "other";
const FORM_1099C_PREFIX = "lender";
const FORM_1099C_KEY_END = "1099c";
const DEBT_PREFIX = "canceled_debt.";

export const DEBT_RELIEF_KEYS = {
  insolvency: "debt_relief.insolvency",
  taxAttributes: "debt_relief.tax_attributes",
} as const;

export function makeForm1099CFactKey(creditorSlug: string, formId: string): string {
  return `${FORM_1099C_PREFIX}.${creditorSlug}.${FORM_1099C_KEY_END}.${formId}`;
}

export function isForm1099CFactKey(key: string): boolean {
  const parts = key.split(".");
  return (
    parts.length === 4 &&
    parts[0] === FORM_1099C_PREFIX &&
    parts[1] !== "" &&
    parts[2] === FORM_1099C_KEY_END &&
    parts[3] !== ""
  );
}

export function makeCanceledDebtFactKey(debtSlug: string): string {
  return `${DEBT_PREFIX}${debtSlug}`;
}

export function isCanceledDebtFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === DEBT_PREFIX && parts[1] !== "";
}

/* The answer key Cade records for a Form 1099-C that no debt fact names yet. */
export function canceledDebtKeyFor1099C(form1099CKey: string): string {
  const [, creditorSlug, , formId] = form1099CKey.split(".");
  return makeCanceledDebtFactKey(`${creditorSlug}-${formId}`);
}

const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isForm1099C = (value: unknown): value is Form1099CFactValue =>
  typeof value === "object" && value !== null && isAmount((value as Form1099CFactValue).box2);

/* Every well-formed Form 1099-C fact, by key, in the order recorded. */
export function getForm1099CFacts(facts: ReadonlyArray<FactRow>): Map<string, Form1099CFactValue> {
  return new Map(
    facts
      .filter((row) => row.category === CANCELED_DEBT_CATEGORY && isForm1099CFactKey(row.key))
      .filter((row) => isForm1099C(row.value))
      .map((row) => [row.key, row.value as Form1099CFactValue]),
  );
}

export interface CanceledDebtFact {
  key: string;
  value: CanceledDebtFactValue;
}

/* Every canceled debt fact, in the order recorded: the order the exclusions apply. */
export function getCanceledDebtFacts(facts: ReadonlyArray<FactRow>): CanceledDebtFact[] {
  return facts
    .filter((row) => row.category === CANCELED_DEBT_CATEGORY && isCanceledDebtFactKey(row.key))
    .filter((row) => typeof row.value === "object" && row.value !== null)
    .map((row) => ({ key: row.key, value: row.value as CanceledDebtFactValue }));
}

/* The Insolvency Worksheet totals, or undefined when absent or not two amounts. */
export function readInsolvencyFact(value: unknown): InsolvencyFactValue | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const fields = value as Record<string, unknown>;
  return isAmount(fields.totalLiabilities) && isAmount(fields.totalAssetsValue)
    ? (value as InsolvencyFactValue)
    : undefined;
}

/* The tax attributes, or undefined when absent or not an object. */
export function readTaxAttributesFact(value: unknown): TaxAttributesFactValue | undefined {
  return typeof value === "object" && value !== null
    ? (value as TaxAttributesFactValue)
    : undefined;
}
