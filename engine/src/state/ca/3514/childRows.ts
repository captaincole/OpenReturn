/*
 * Part III, lines 5–12, for Child 1 to Child 3 (ca-3514-inst-2025::sec::child-1-child-2-child-3::b01,
 * ::b03): the listed qualifying children (children.ts), young children first.
 * A column with no child stays blank.
 */

import type { BindingFn, FormAccessor } from "../../../defineForm.js";
import { ageAtYearEnd, type DependentFact } from "../../../facts/index.js";
import {
  birthYear,
  isYoungerThan,
  TAX_YEAR,
} from "../../../federal/schedule-eic/qualifyingChild.js";
import { unsupported } from "../../../types.js";
import { ssnOf } from "../../../values.js";
import { childSsnOrItin } from "./children.js";
import type { Form3514FilingInfo } from "./filingInfo.js";
import type { Form3514 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form3514]: BindingFn<Form3514, Form3514FilingInfo, K> }>;
type RowBinding = (form: FormAccessor<Form3514>, info: Form3514FilingInfo) => unknown;

// Line 11: "Do not enter more than 365 days" (2025 is not a leap year).
const DAYS_IN_2025 = 365;

export const DAYS_LIVED_GAP =
  "FTB 3514 line 11 needs the days a child lived with you in California, and the dependent fact records months; only a full year (or a child born in 2025) is known to be 365 days.";

/* Younger than the taxpayer, or the spouse on a joint return. */
function youngerThanAFiler(child: DependentFact, info: Form3514FilingInfo): boolean {
  const joint = info.filingStatus === "married_filing_jointly";
  const filers = [info.taxpayerDateOfBirth, ...(joint ? [info.spouseDateOfBirth] : [])];
  return filers.some((dob) => isYoungerThan(child.dependent.dob, dob) === true);
}

/*
 * Line 8: "If born after 2006 and the child is younger than you (or your
 * spouse/RDP, if filing jointly), skip line 9a and line 9b; go to line 10."
 */
function skipsLine9(child: DependentFact, info: Form3514FilingInfo): boolean {
  return Number(birthYear(child.dependent.dob)) > 2006 && youngerThanAFiler(child, info);
}

/* Line 9a: "under age 24 at the end of 2025, a student, and younger than you". */
function line9a(child: DependentFact, info: Form3514FilingInfo): string | undefined {
  if (skipsLine9(child, info)) return undefined;
  const age = ageAtYearEnd(child.dependent.dob, TAX_YEAR);
  const student = child.dependent.fullTimeStudent === true;
  return age !== undefined && age < 24 && student && youngerThanAFiler(child, info) ? "yes" : "no";
}

/* Line 9b: asked only when 9a is no; "If no, stop here. The child is not a qualifying child." */
function line9b(child: DependentFact, info: Form3514FilingInfo): string | undefined {
  if (line9a(child, info) !== "no") return undefined;
  return child.dependent.permanentlyDisabled === true ? "yes" : "no";
}

/*
 * Line 11 (::sec::line-11::b01): the days the child lived with you in
 * California; 365 for a child born in 2025 whose home was yours. A full-year
 * resident's child who lived with the taxpayer 12 months lived 365 days in
 * California. Fewer months are a gap.
 */
function line11(child: DependentFact) {
  const { monthsLivedWithYou, dob } = child.dependent;
  if (monthsLivedWithYou === 12 || birthYear(dob) === String(TAX_YEAR)) return DAYS_IN_2025;
  return unsupported(DAYS_LIVED_GAP);
}

/*
 * Line 12 (::sec::line-12::b01): the California home the child shared with
 * the taxpayer longest. A qualifying child lived with the full-year resident
 * filer, so it is the home address on the return; no fact records a move.
 */
function line12Street(info: Form3514FilingInfo): string | undefined {
  const street = info.homeAddressLine1;
  return street && info.homeAddressApt ? `${street} ${info.homeAddressApt}` : street;
}

export function childRowBindings(): Bindings {
  const bindings: Record<string, RowBinding> = {};
  for (const column of [1, 2, 3]) {
    const child = (info: Form3514FilingInfo) => info.caEitcChildren?.[column - 1];
    const on = <T>(read: (row: DependentFact, info: Form3514FilingInfo) => T): RowBinding => {
      return (_, info) => {
        const row = child(info);
        return row === undefined ? undefined : read(row, info);
      };
    };
    // A malformed number leaves the line blank, not an error (ssnOf).
    const tin = (row: DependentFact) => ssnOf(childSsnOrItin(row));
    bindings[`0.line.5_first_name_child_${column}`] = on((row) => row.dependent.firstName);
    bindings[`0.line.6_last_name_child_${column}`] = on((row) => row.dependent.lastName);
    bindings[`0.line.7_ssn_or_itin_child_${column}`] = on(tin);
    bindings[`0.line.8_date_of_birth_child_${column}`] = on((row) => row.dependent.dob);
    bindings[`0.line.9a_student_under_24_child_${column}`] = on(line9a);
    bindings[`0.line.9b_permanently_disabled_child_${column}`] = on(line9b);
    bindings[`0.line.10_relationship_child_${column}`] = on((row) => row.dependent.relationship);
    bindings[`0.line.11_days_lived_in_ca_child_${column}`] = on(line11);
    bindings[`1.line.12a_street_address_child_${column}`] = on((_, info) => line12Street(info));
    bindings[`1.line.12b_city_child_${column}`] = on((_, info) => info.homeAddressCity);
    bindings[`1.line.12c_state_child_${column}`] = on((_, info) => info.homeAddressState);
    bindings[`1.line.12d_zip_child_${column}`] = on((_, info) => info.homeAddressZip);
  }
  return bindings as Bindings;
}
