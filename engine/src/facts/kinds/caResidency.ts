/*
 * California residency, as the taxpayer states it. The engine does not test
 * residency (issue #336): the taxpayer says full-year resident, part-year
 * resident or nonresident, and Cade records it.
 *
 * The return's answer is the decision `decisions.scope.ca_residency`
 * ("full_year" | "part_year" | "non_resident"). A full-year resident files
 * Form 540; a part-year resident or a nonresident with a California filing
 * requirement files Form 540NR (ca-540nr-booklet-2025::sec::which-form-to-use::b01).
 *
 * On Form 540NR, Schedule CA (540NR) Part I asks each person for the dates
 * and the states (ca-540nr-sched-ca-inst-2025::sec::part-i-residency-information::b01:
 * "Answer all the questions in this part for you and your spouse/RDP. If a
 * question does not apply, then leave the line blank"). One fact per person
 * holds those answers; a part that is absent does not apply.
 */

type FactRow = { key: string; value: unknown; category: string };

export const CA_RESIDENCY_DECISION_KEY = "decisions.scope.ca_residency";

/* The values of the decision. */
export const CA_RESIDENCY = {
  fullYear: "full_year",
  partYear: "part_year",
  nonresident: "non_resident",
} as const;

/* Part I line 1: the person's residency during 2025, as the form's three boxes name it. */
export type CaPersonResidency = "resident" | "part_year_resident" | "nonresident";

/* A move into or out of California: the other state (two letters, "FC" for a foreign country) and the date. */
export interface CaResidencyMove {
  state: string;
  /* mm/dd/yyyy, as the form prints it. */
  date: string;
}

export interface CaResidencyFactValue {
  /* Line 1: resident, part-year resident or nonresident during 2025. */
  residency: CaPersonResidency;
  /*
   * Line 2a: the state of domicile, "the place you consider your permanent
   * home" (ca-540nr-sched-ca-inst-2025::sec::line-2-domicile-and-military::b01).
   */
  domicileState: string;
  /* Line 2b: the state where a member of the military was stationed. Absent: not in the military. */
  militaryStationState?: string;
  /* Line 3: became a California resident in 2025, from this state on this date. */
  becameResident?: CaResidencyMove;
  /* Line 4: became a California nonresident in 2025, to this state on this date. */
  becameNonresident?: CaResidencyMove;
  /* Line 5: the state of residence of a nonresident the entire year. */
  nonresidentAllYearState?: string;
  /*
   * Line 6: the days in California "for any purpose including residency,
   * business, and vacation" (::line-6-the-number-of-days-i-spent-in-california::b01).
   */
  daysInCalifornia: number;
  /* Line 7: owned a home or property in California, directly or through a trust or other entity. */
  ownedCaliforniaProperty: boolean;
  /*
   * Line 8: the most recent period of California residency before 2025, as
   * mm/dd/yyyy dates. "If you became a nonresident during taxable year 2025,
   * use December 31, 2024 as your end date" (::line-8-before-2025-i-was-a-california-resident-for-the-period-of::b01).
   * Absent: never a California resident before 2025.
   */
  priorResidency?: { begin: string; end: string };
}

const RESIDENCY_CATEGORY = "identity";

export const CA_RESIDENCY_FACT_KEYS = {
  taxpayer: "ca_residency.taxpayer",
  spouse: "ca_residency.spouse",
} as const;

export type CaResidencyPerson = keyof typeof CA_RESIDENCY_FACT_KEYS;

/* The person's Part I answers; undefined when Cade has not recorded them. */
export function readCaResidencyFact(
  facts: ReadonlyArray<FactRow>,
  person: CaResidencyPerson,
): CaResidencyFactValue | undefined {
  const row = facts.find(
    (fact) => fact.category === RESIDENCY_CATEGORY && fact.key === CA_RESIDENCY_FACT_KEYS[person],
  );
  return row === undefined ? undefined : (row.value as CaResidencyFactValue);
}
