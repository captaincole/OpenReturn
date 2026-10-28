/*
 * W-2s the taxpayer issued as a household employer (Schedule H), not the taxpayer's own wages.
 * Boxes 3 and 5 already exclude exempt wages (e.g. paid to a spouse or parent), so Schedule H reads them directly.
 */

import type { FactsView } from "../../types.js";
import type { TaxFactRow } from "../rows.js";

export interface HouseholdEmployeeFactValue {
  employeeName: string;
  /* W-2 box b. */
  employerEin: string;
  box1?: number; // Wages, tips, other compensation
  box2?: number; // Federal income tax withheld
  box3: number; // Social security wages
  box4?: number; // Social security tax withheld (employee share)
  box5: number; // Medicare wages and tips
  box6?: number; // Medicare tax withheld (employee share)
}

export const HOUSEHOLD_EMPLOYMENT_KEYS = {
  /* Schedule H line C / line 9: $1,000+ cash wages in any quarter of 2024 or 2025. Yes means FUTA. */
  paid1000InAQuarter: "household_employment.paid_1000_in_a_quarter",
} as const;

const HH_CATEGORY = "household_employment";
const HH_KEY_RE = /^employee\.([^.]+)\.household_w2$/;

export function makeHouseholdEmployeeFactKey(employeeSlug: string): string {
  return `employee.${employeeSlug}.household_w2`;
}

export function isHouseholdEmployeeFactKey(key: string): boolean {
  return HH_KEY_RE.test(key);
}

export function isHouseholdEmployeeFact(f: TaxFactRow): boolean {
  return f.category === HH_CATEGORY && HH_KEY_RE.test(f.key);
}

export function getHouseholdEmployeeFacts(facts: FactsView): HouseholdEmployeeFactValue[] {
  return facts
    .byCategory(HH_CATEGORY)
    .filter(isHouseholdEmployeeFact)
    .map((f) => f.value as HouseholdEmployeeFactValue);
}
