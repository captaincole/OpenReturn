/*
 * Form 8826: the disabled access credit of an eligible small business
 * (irs-8826-form-2025::sec::purpose-of-form::b01). One fact per group of
 * eligible access expenditures that a Schedule C business paid or incurred in
 * 2025 and deducts on one expense line (a ramp under repairs, an interpreter
 * under contract labor), from the business's books. No information return
 * reports them: the owner states them. Line 1 adds every fact on the return.
 *
 * Two prior-year answers decide whether the taxpayer is an eligible small
 * business: the gross receipts of 2024, then, only when they were above
 * $1,000,000, the full-time employees of 2024 (purpose-of-form::b01). They are
 * the taxpayer's answers for all of the taxpayer's businesses, one each for
 * the return.
 *
 * A credit from a partnership or S corporation is not a fact of this kind: it
 * is the K-1's box 15 or box 13 code K (federal/passThrough), which Form 3800
 * line 1e and Form 8826 line 7 read.
 */

import type { BusinessExpenses } from "./business.js";

type FactRow = { key: string; value: unknown; category: string };

/*
 * Where the business deducts the expenditures: a Schedule C expense line
 * (BusinessExpenses), "otherExpenses" for one Part V entry (line 48, where the
 * Schedule C instructions put the deduction for removing barriers,
 * irs-1040sc-inst-2025::sec::part-v::b03), or "capitalized" when they were
 * added to the basis of property. Depreciation and depletion are allowances,
 * not payments, so an expenditure is never stated as one of them:
 * capitalized property's depreciation is the "capitalized" case.
 */
export type DisabledAccessDeductedOn =
  Exclude<keyof BusinessExpenses, "depreciation" | "depletion"> | "otherExpenses" | "capitalized";

export interface DisabledAccessFactValue {
  /* The Schedule C business (`business.<id>`) that paid or incurred the expenditures and deducts them. */
  businessKey: string;
  /*
   * Line 1: the eligible access expenditures paid or incurred in 2025 to
   * comply with the Americans With Disabilities Act: removing barriers,
   * interpreters, readers, equipment for individuals with disabilities. Not
   * barrier removal for a facility first placed in service after November 5,
   * 1990 (irs-8826-form-2025::sec::eligible-access-expenditures::b01).
   */
  expenditures: number;
  /* The expense line of Schedule C that holds the expenditures, before the credit. */
  deductedOn: DisabledAccessDeductedOn;
  /*
   * With deductedOn "otherExpenses" only, and then required: the description
   * of the business fact's Part V entry that holds the expenditures, as stated
   * there ("Barrier removal"). The first entry with that description takes
   * the reduction.
   */
  otherExpense?: string;
  /*
   * A member of a controlled group of corporations or of businesses under
   * common control figures the credit on the group's expenditures and enters
   * its share on line 6 (irs-8826-form-2025::sec::member-of-controlled-group-or::b01).
   * Absent: not a member.
   */
  memberOfControlledGroup?: boolean;
}

export interface DisabledAccessFact {
  key: string;
  value: DisabledAccessFactValue;
}

const DISABLED_ACCESS_CATEGORY = "self_employment";
const DISABLED_ACCESS_PREFIX = "disabled_access.";

export const DISABLED_ACCESS_KEYS = {
  /*
   * The 2024 gross receipts of all of the taxpayer's businesses (and any
   * predecessor), reduced by returns and allowances: a number
   * (irs-8826-form-2025::sec::purpose-of-form::b01).
   */
  priorYearGrossReceipts: "prior_year.disabled_access_gross_receipts",
  /*
   * The number of full-time employees in 2024: each employed at least 30
   * hours per week for 20 or more calendar weeks. Asked only when the gross
   * receipts were above $1,000,000.
   */
  priorYearFullTimeEmployees: "prior_year.disabled_access_full_time_employees",
} as const;

/* The slug names the expenditures ("entrance-ramp"); the fact's businessKey names the business. */
export function makeDisabledAccessFactKey(slug: string): string {
  return `${DISABLED_ACCESS_PREFIX}${slug}`;
}

export function isDisabledAccessFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === DISABLED_ACCESS_PREFIX && parts[1] !== "";
}

const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const DEDUCTED_ON: ReadonlyArray<DisabledAccessDeductedOn> = [
  "advertising",
  "carAndTruck",
  "commissionsAndFees",
  "contractLabor",
  "employeeBenefitPrograms",
  "insurance",
  "mortgageInterest",
  "otherInterest",
  "legalAndProfessional",
  "office",
  "pensionAndProfitSharing",
  "rentVehiclesMachinery",
  "rentOtherProperty",
  "repairs",
  "supplies",
  "taxesAndLicenses",
  "travel",
  "deductibleMeals",
  "utilities",
  "wages",
  "energyEfficientBuildings",
  "otherExpenses",
  "capitalized",
];

/* A Part V entry is named exactly when the line is Part V. */
const namesItsOtherExpense = (fact: Record<string, unknown>) =>
  fact.deductedOn === "otherExpenses"
    ? typeof fact.otherExpense === "string" && fact.otherExpense !== ""
    : fact.otherExpense === undefined;

function isDisabledAccess(value: unknown): value is DisabledAccessFactValue {
  if (typeof value !== "object" || value === null) return false;
  const fact = value as Record<string, unknown>;
  return (
    typeof fact.businessKey === "string" &&
    isAmount(fact.expenditures) &&
    DEDUCTED_ON.includes(fact.deductedOn as DisabledAccessDeductedOn) &&
    namesItsOtherExpense(fact) &&
    (fact.memberOfControlledGroup === undefined ||
      typeof fact.memberOfControlledGroup === "boolean")
  );
}

/* Every disabled access fact, in the order recorded; a malformed one is left out and listed. */
export function readDisabledAccessFacts(facts: ReadonlyArray<FactRow>): {
  expenditures: DisabledAccessFact[];
  malformedKeys: string[];
} {
  const rows = facts.filter(
    (row) => row.category === DISABLED_ACCESS_CATEGORY && isDisabledAccessFactKey(row.key),
  );
  return {
    expenditures: rows
      .filter((row) => isDisabledAccess(row.value))
      .map((row) => ({ key: row.key, value: row.value as DisabledAccessFactValue })),
    malformedKeys: rows.filter((row) => !isDisabledAccess(row.value)).map((row) => row.key),
  };
}

/* The two prior-year answers as stated; a value that is not a number counts as not stated. */
export function readDisabledAccessPriorYear(facts: ReadonlyArray<FactRow>): {
  grossReceipts?: number;
  fullTimeEmployees?: number;
} {
  const numberAt = (key: string) => {
    const value = facts.find((row) => row.key === key)?.value;
    return isAmount(value) ? value : undefined;
  };
  return {
    grossReceipts: numberAt(DISABLED_ACCESS_KEYS.priorYearGrossReceipts),
    fullTimeEmployees: numberAt(DISABLED_ACCESS_KEYS.priorYearFullTimeEmployees),
  };
}
