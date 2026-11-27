/*
 * Form 8882: one fact per qualified childcare expenditure of the taxpayer's
 * own Schedule C business, from the business's books. No information return
 * reports them: the employer states what it "paid or incurred" in 2025
 * (irs-8882-form-2025::sec::how-to-figure-the-credit::b01). The facts are the
 * claim: an expenditure the taxpayer does not claim the credit for has no fact.
 *
 * The amount is already a qualified amount: "Any expenses for childcare
 * included in qualified childcare facility expenditures may not exceed the
 * fair market value of such care" (same block), and the facility meets the
 * conditions of how-to-figure-the-credit::b02 (licensed, open to employees,
 * no discrimination in favor of highly compensated employees).
 *
 * "No Double Benefit Allowed" (irs-8882-form-2025::sec::form-8882-rev-12-2017-page-2::b01):
 * the credit lowers the basis of the facility property and the deductions the
 * expenditures gave. So each fact names where its amount is on the business's
 * return: the 2025 asset of its depreciation (Form 4562) for property, or the
 * Schedule C expense line for the other kinds. businessesOnReturn
 * (activitiesOnReturn.ts) takes the credit off there.
 *
 * A credit from a partnership or S corporation is the K-1's box 15 or box 13
 * code AH (federal/passThrough), which Form 8882 line 5 reads.
 */

type FactRow = { key: string; value: unknown; category: string };

/*
 * The kinds of qualified expenditure (irs-8882-form-2025::sec::how-to-figure-the-credit::b01
 * and ::b02): line 1 takes the first three, line 3 the last.
 * - facility_property: "To acquire, construct, rehabilitate, or expand
 *   property" used in the taxpayer's qualified childcare facility, depreciable
 *   and not part of a principal residence.
 * - facility_operating: "the operating expenses of a qualified childcare
 *   facility of the taxpayer, including expenses for training of employees,
 *   scholarship programs, and providing increased compensation".
 * - facility_contract: "Under a contract with a qualified childcare facility to
 *   provide childcare services to employees of the taxpayer".
 * - resource_and_referral: "amounts paid or incurred under a contract to
 *   provide childcare resource and referral services to employees".
 */
export const CHILDCARE_EXPENDITURE_KINDS = [
  "facility_property",
  "facility_operating",
  "facility_contract",
  "resource_and_referral",
] as const;
export type ChildcareExpenditureKind = (typeof CHILDCARE_EXPENDITURE_KINDS)[number];

/*
 * The Schedule C expense lines (BusinessExpenses) a deductible expenditure can
 * be on. Depreciation and depletion are not: property is an asset of Form
 * 4562, named by `asset`.
 */
export const CHILDCARE_DEDUCTION_LINES = [
  "advertising",
  "commissionsAndFees",
  "contractLabor",
  "employeeBenefitPrograms",
  "insurance",
  "otherInterest",
  "legalAndProfessional",
  "office",
  "rentOtherProperty",
  "repairs",
  "supplies",
  "taxesAndLicenses",
  "travel",
  "utilities",
  "wages",
] as const;
export type ChildcareDeductionLine = (typeof CHILDCARE_DEDUCTION_LINES)[number];

/* A Part V other expense (line 48), named by its description. */
export const OTHER_EXPENSE = "other_expense";

export interface ChildcareExpenditureFactValue {
  /* The Schedule C business (`business.<id>`) that paid or incurred it. */
  businessKey: string;
  kind: ChildcareExpenditureKind;
  /* What it paid for, as the books show it. No line prints it. */
  description: string;
  /* The qualified amount paid or incurred in 2025, not more than the care's fair market value. */
  amount: number;
  /*
   * facility_property: the description of the asset placed in service in
   * 2025 in the business's depreciation (Form 4562) that the amount paid for.
   * Its depreciable basis is reduced by the credit allocable to it.
   */
  asset?: string;
  /*
   * facility_property: true when the property is not placed in service in
   * 2025 (construction goes on). No 2025 depreciation reads its basis. One of
   * `asset` or this is required.
   */
  notPlacedInService?: boolean;
  /* The other kinds: the Schedule C line that deducts the amount. */
  deductedOn?: ChildcareDeductionLine | typeof OTHER_EXPENSE;
  /* With deductedOn "other_expense": the description of the Part V expense that holds it. */
  otherExpense?: string;
}

export interface ChildcareExpenditureFact {
  key: string;
  value: ChildcareExpenditureFactValue;
}

const CATEGORY = "self_employment";
const PREFIX = "childcare_expenditure.";

export function makeChildcareExpenditureFactKey(slug: string): string {
  return `${PREFIX}${slug}`;
}

export function isChildcareExpenditureFactKey(key: string): boolean {
  const slug = key.slice(PREFIX.length);
  return key.startsWith(PREFIX) && slug !== "" && !slug.includes(".");
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

/* Property names its asset, or says it is not placed in service; the other kinds name a deduction line. */
function placesItsAmount(fact: Record<string, unknown>): boolean {
  if (fact.kind === "facility_property") {
    const named = typeof fact.asset === "string" && fact.asset !== "";
    return named !== (fact.notPlacedInService === true) && fact.deductedOn === undefined;
  }
  if (fact.asset !== undefined || fact.notPlacedInService !== undefined) return false;
  if (fact.deductedOn === OTHER_EXPENSE) {
    return typeof fact.otherExpense === "string" && fact.otherExpense !== "";
  }
  return (
    CHILDCARE_DEDUCTION_LINES.includes(fact.deductedOn as ChildcareDeductionLine) &&
    fact.otherExpense === undefined
  );
}

function isExpenditure(value: unknown): value is ChildcareExpenditureFactValue {
  if (!isRecord(value)) return false;
  return (
    typeof value.businessKey === "string" &&
    CHILDCARE_EXPENDITURE_KINDS.includes(value.kind as ChildcareExpenditureKind) &&
    typeof value.description === "string" &&
    isAmount(value.amount) &&
    placesItsAmount(value)
  );
}

/* Every expenditure fact, in the order recorded; a malformed one is left out and listed. */
export function readChildcareExpenditureFacts(facts: ReadonlyArray<FactRow>): {
  expenditures: ChildcareExpenditureFact[];
  malformedKeys: string[];
} {
  const rows = facts.filter(
    (row) => row.category === CATEGORY && isChildcareExpenditureFactKey(row.key),
  );
  return {
    expenditures: rows
      .filter((row) => isExpenditure(row.value))
      .map((row) => ({ key: row.key, value: row.value as ChildcareExpenditureFactValue })),
    malformedKeys: rows.filter((row) => !isExpenditure(row.value)).map((row) => row.key),
  };
}
