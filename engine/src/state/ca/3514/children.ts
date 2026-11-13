/*
 * FTB 3514's qualifying children (Step 3, ca-3514-inst-2025::sec::step-3-qualifying-child::b01):
 * the federal EIC's relationship and age tests, and a child who "Lived with you
 * in California for more than half of 2025". The engine files the form for a
 * full-year resident only, so the federal test (lived with the taxpayer in the
 * United States more than half the year) is the California one. A child
 * counts in the EITC Table column only with a valid SSN or federal ITIN
 * (Step 1, question c); an ATIN does not count (::sec::valid-itin::b01).
 */

import { ageAtYearEnd, type DependentFact } from "../../../facts/index.js";
import { eicQualifyingChildren, TAX_YEAR } from "../../../federal/schedule-eic/qualifyingChild.js";
import type { ResolverInputs } from "../../../resolverInputs.js";

// An ATIN's middle two digits are 93 (IRS Form W-7A); an ITIN's never are.
const ATIN_GROUP = "93";

/* A child's SSN, or an ITIN that is not an ATIN; undefined when there is none. */
export function childSsnOrItin(child: DependentFact): string | undefined {
  const { ssn, tin } = child.dependent;
  if (ssn !== undefined) return ssn;
  const digits = tin?.replaceAll("-", "");
  return digits?.length === 9 && digits.slice(3, 5) !== ATIN_GROUP ? tin : undefined;
}

/*
 * Step 8: "younger than six years old as of the last day of the taxable year"
 * (ca-3514-inst-2025::sec::step-8-qualifications-for-young-child-tax::b01).
 * Unlike Step 4, question b, the instructions give no birth date for the age,
 * so the age is the birth-year difference: a child born January 1, 2020 is 5.
 */
export function isYoungChild(child: DependentFact): boolean {
  const age = ageAtYearEnd(child.dependent.dob, TAX_YEAR);
  return age !== undefined && age < 6;
}

export interface CaEitcChildren {
  /** Qualifying children with a valid SSN or ITIN: Part III's columns and the table column. */
  listed: DependentFact[];
  /** A dependent's qualifying-child test still waits on an answer. */
  open: DependentFact[];
}

/*
 * Part III lists up to three children. A child younger than six must be in a
 * column, not an attachment (::sec::step-8-qualifications-for-young-child-tax::b02),
 * so the young children come first; the rest keep the order recorded.
 */
export function caEitcChildren(inputs: ResolverInputs): CaEitcChildren {
  const { children, open } = eicQualifyingChildren(inputs);
  const valid = children.filter((child) => childSsnOrItin(child) !== undefined);
  return {
    listed: [...valid.filter(isYoungChild), ...valid.filter((child) => !isYoungChild(child))],
    open,
  };
}
