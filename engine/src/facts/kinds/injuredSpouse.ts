/*
 * Form 8379, injured spouse allocation: one fact for a joint return whose
 * overpayment was, or will be, applied to a past-due debt of one spouse
 * (irs-8379-inst-2025::sec::general-instructions::b01). It holds the answers no
 * document prints: the Part I questions, the Part II choices, and the injured
 * spouse's share (Part III column (b)) of each item the instructions leave to
 * the spouses.
 *
 * The engine figures the rest from other facts: column (a) from the joint
 * return; line 13a and most of line 19 from the W-2s and the 1099-Rs of each
 * spouse; line 15 from the standard deduction rule
 * (irs-8379-inst-2025::sec::line-15::b01).
 *
 * Each share is the injured spouse's amount, in whole dollars, for the item as
 * the joint return shows it. A share the spouses split by a rule of the
 * instructions is stated by that rule: a separate item goes to the spouse who
 * would have shown it on a separate return, a joint item "as you determine"
 * (irs-8379-inst-2025::sec::part-iii::b01).
 */

export type InjuredSpouse = "taxpayer" | "spouse";

export interface InjuredSpouseShares {
  /*
   * Line 13b: the injured spouse's part of all income other than W-2 wages
   * (Form 1040 lines 1b to 8; irs-8379-inst-2025::sec::line-13b::b01). Joint
   * interest "as you determine". Can be negative (a loss).
   */
  otherIncome: number;
  /* Line 14: the adjustments the injured spouse would have claimed (line-14::b01). */
  adjustments: number;
  /*
   * Line 15, only when the joint return itemizes: the injured spouse's own
   * deductions, such as state and local income taxes, and a share of the
   * others (basic-standard-deduction::b02). Absent with the standard deduction.
   */
  itemizedDeductions?: number;
  /*
   * Line 16: the nonrefundable credits. A child tax credit, credit for other
   * dependents, dependent care credit or a dependent's education credit goes to
   * the spouse who would have claimed the dependent (line-16::b01).
   */
  nonrefundableCredits: number;
  /*
   * Line 17: the refundable credits other than the earned income credit. The
   * additional child tax credit to the spouse who would have claimed the child;
   * a business credit by each spouse's interest in the business (line-17::b01).
   */
  refundableCredits: number;
  /*
   * Line 18: the other taxes. Self-employment tax to the spouse who earned the
   * income; the net investment income tax as line 13b allocates the investment
   * income (line-18::b01).
   */
  otherTaxes: number;
  /*
   * Line 19, the part no W-2 or 1099-R fact shows by spouse: the federal income
   * tax withheld on the injured spouse's other Forms 1099, SSA-1099 and W-2G
   * (line-19::b01). The engine adds the injured spouse's W-2 box 2, 1099-R
   * box 4 and Additional Medicare Tax withholding.
   */
  otherWithholding: number;
  /*
   * Line 20: the injured spouse's estimated tax payments and payment with an
   * extension: their own, and the share of joint payments both spouses agree
   * on (line-20::b01).
   */
  payments: number;
}

export interface InjuredSpouseFactValue {
  /* Which spouse on the return is the injured spouse (line 10). */
  injuredSpouse: InjuredSpouse;
  /*
   * Line 3: the IRS used, or will use, the joint overpayment for a legally
   * enforceable past-due debt owed only by the other spouse. A federal tax
   * debt of a joint return both spouses filed is owed by both, so it is false
   * (the line 3 note sends that case to innocent spouse relief,
   * irs-8379-face-2025::sec::face-part-i::b01).
   */
  offsetForOtherSpouseDebt: boolean;
  /* Line 4: the injured spouse is legally obligated to pay that debt. */
  legallyObligated: boolean;
  /*
   * Line 5: the community property states where, at any time in 2025, the
   * spouses lived and meant to make a permanent home (line-5::b01), as
   * two-letter codes. Empty: none.
   */
  communityPropertyStates: string[];
  /* Line 11: the refund is to be issued in both names. */
  refundInBothNames: boolean;
  /* Line 12: an address for the injured spouse's refund other than the return's; absent: none. */
  refundMailingAddress?: string;
  shares: InjuredSpouseShares;
  /*
   * Line 20: true when the spouses do not agree on how to split joint
   * estimated tax payments. The IRS then splits them by each spouse's separate
   * tax liability (line-20::b01). Absent: they agree.
   */
  paymentsNotAgreed?: boolean;
}

export const INJURED_SPOUSE_CATEGORY = "other";
export const INJURED_SPOUSE_KEY = "refund.injured_spouse";

/* The nine community property states (irs-8379-inst-2025::sec::line-5::b01). */
export const COMMUNITY_PROPERTY_STATES: ReadonlyArray<string> = [
  "AZ",
  "CA",
  "ID",
  "LA",
  "NV",
  "NM",
  "TX",
  "WA",
  "WI",
];

const REQUIRED_SHARES: Array<keyof InjuredSpouseShares> = [
  "otherIncome",
  "adjustments",
  "nonrefundableCredits",
  "refundableCredits",
  "otherTaxes",
  "otherWithholding",
  "payments",
];

const isNumber = (value: unknown): boolean => typeof value === "number" && Number.isFinite(value);
const isAmount = (value: unknown): boolean => isNumber(value) && (value as number) >= 0;

function validShares(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const shares = value as Record<string, unknown>;
  const amounts = REQUIRED_SHARES.filter((field) => field !== "otherIncome");
  return (
    isNumber(shares.otherIncome) &&
    amounts.every((field) => isAmount(shares[field])) &&
    (shares.itemizedDeductions === undefined || isAmount(shares.itemizedDeductions))
  );
}

function validStates(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every((state) => typeof state === "string" && COMMUNITY_PROPERTY_STATES.includes(state))
  );
}

/*
 * Cade records this fact as one object he writes himself, so check it. A field
 * that is not the right type makes the whole fact missing, and Cade asks again.
 */
export function readInjuredSpouseFact(
  factByKey: ReadonlyMap<string, unknown>,
): InjuredSpouseFactValue | undefined {
  const value = factByKey.get(INJURED_SPOUSE_KEY);
  if (typeof value !== "object" || value === null) return undefined;
  const fields = value as Record<string, unknown>;
  const valid =
    (fields.injuredSpouse === "taxpayer" || fields.injuredSpouse === "spouse") &&
    typeof fields.offsetForOtherSpouseDebt === "boolean" &&
    typeof fields.legallyObligated === "boolean" &&
    validStates(fields.communityPropertyStates) &&
    typeof fields.refundInBothNames === "boolean" &&
    (fields.refundMailingAddress === undefined ||
      typeof fields.refundMailingAddress === "string") &&
    (fields.paymentsNotAgreed === undefined || typeof fields.paymentsNotAgreed === "boolean") &&
    validShares(fields.shares);
  return valid ? (value as InjuredSpouseFactValue) : undefined;
}
