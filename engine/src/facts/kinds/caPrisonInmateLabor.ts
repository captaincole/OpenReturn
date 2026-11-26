/*
 * FTB 3507, the prison inmate labor credit: 10% of the wages an employer pays
 * to prison inmates "under an approved joint venture with the California
 * Department of Corrections" (ca-3507-form-2025::sec::a-purpose::b01,
 * ::b-qualifications::b01). The employer keeps the joint venture agreement
 * (the form's heading), so no document comes with it: the taxpayer states the
 * wages from the business's payroll records.
 *
 * Three inputs: the qualifying wages the taxpayer paid (line 1), one fact per
 * entity that passed a credit through on a Schedule K-1 (100S, 541, 565 or
 * 568) (line 3), and last year's carryover (line 4). The California K-1 itself
 * is not in the engine: the credit is stated as the K-1 prints it.
 */

type FactRow = { key: string; value: unknown; category: string };

/* Line 1 (ca-3507-form-2025::sec::line-1::b01). */
export interface CaPrisonInmateWagesFactValue {
  /*
   * "the total amount of qualifying wages paid or incurred under the provisions
   * of the approved joint venture": wages paid to each inmate under a contract
   * executed on or before the day the inmate began work
   * (ca-3507-form-2025::sec::b-qualifications::b01). 0 when none.
   */
  wages: number;
  /*
   * The wages were paid by a single member LLC that is disregarded for tax
   * purposes. The credit's use is then limited to the tax on that LLC's income
   * (ca-3507-form-2025::sec::c-limitations::b01), which the engine does not
   * figure. Absent: the taxpayer paid them directly.
   */
  throughDisregardedSmllc?: boolean;
}

/* Line 3: one entity's pass-through credit (ca-3507-form-2025::sec::line-3::b01). */
export interface CaPrisonInmateLaborPassThroughFactValue {
  /* The entity's name, for the schedule the line asks for. */
  entityName: string;
  /* The entity's identification number (California corporation number, Secretary of State file number or FEIN). */
  entityId: string;
  /* The credit as the Schedule K-1 (100S, 541, 565 or 568) reports it. */
  credit: number;
  /* The credit came through a disregarded single member LLC (the same limit as the wages). */
  throughDisregardedSmllc?: boolean;
}

export interface CaPrisonInmateLaborPassThroughFact {
  key: string;
  value: CaPrisonInmateLaborPassThroughFactValue;
}

export const CA_PRISON_INMATE_LABOR_KEYS = {
  /* Line 1: a CaPrisonInmateWagesFactValue. */
  qualifyingWages: "ca_prison_inmate_labor.qualifying_wages",
  /*
   * Line 4: "the amount of credit carryover from 2024", the 2024 FTB 3507 line 7
   * (ca-3507-form-2025::sec::line-4::b01). A number; 0 when none.
   */
  carryover: "prior_year.ca_prison_inmate_labor_credit_carryover",
} as const;

/*
 * The irrevocable election, on FTB 3870, to make the business credits that the
 * $5,000,000 limitation disallows refundable in later years
 * (ca-3507-form-2025::sec::credit-limitation::b01). One answer for the return:
 * "you must make the same election for all other credits"
 * (ca-3507-form-2025::sec::line-6c::b01). A boolean, asked only when the limit
 * can bind.
 */
export const CA_BUSINESS_CREDIT_REFUNDABLE_ELECTION_KEY =
  "ca_business_credit_limitation.elect_refundable";

const PASS_THROUGH_CATEGORY = "state_local_tax";
const PASS_THROUGH_PREFIX = "ca_prison_inmate_labor_pass_through.";

export function makeCaPrisonInmateLaborPassThroughFactKey(entitySlug: string): string {
  return `${PASS_THROUGH_PREFIX}${entitySlug}`;
}

export function isCaPrisonInmateLaborPassThroughFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === PASS_THROUGH_PREFIX && parts[1] !== "";
}

/* Every pass-through credit fact, in the order recorded. */
export function getCaPrisonInmateLaborPassThroughFacts(
  facts: ReadonlyArray<FactRow>,
): CaPrisonInmateLaborPassThroughFact[] {
  return facts
    .filter(
      (row) =>
        row.category === PASS_THROUGH_CATEGORY && isCaPrisonInmateLaborPassThroughFactKey(row.key),
    )
    .map((row) => ({ key: row.key, value: row.value as CaPrisonInmateLaborPassThroughFactValue }));
}
