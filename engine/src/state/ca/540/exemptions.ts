/* Form 540 exemptions: lines 7 to 11, with line 10's Dependents table. */

import type { BindingFn } from "../../../defineForm.js";
import type { DependentFactValue } from "../../../facts/kinds/dependents.js";
import { sum } from "../../../money.js";
import { ssn } from "../../../values.js";
import type { Form540FilingInfo } from "./filingInfo.js";
import type { Form540Line } from "./form540Binding.js";
import type { Form540 } from "./types.js";

/*
 * MANUAL EDIT: the dependent exemption credit pre-printed on the 2025 form
 * ("Total dependent exemptions X $475", ca-540nr-booklet-2025::sec::dependent-1-dependent-2-dependent-3::b01).
 * The instructions multiply the line 10 count by it
 * (ca-540-inst-2025::sec::line-10-dependent-exemptions::b01).
 */
const CA_DEPENDENT_EXEMPTION_2025 = 475;

/*
 * MANUAL EDIT: the personal, blind and senior exemption credit pre-printed on the
 * 2025 form: "Multiply the number you put in the line 7 box by $153" (the form's
 * lines 7, 8 and 9).
 */
const CA_EXEMPTION_CREDIT_2025 = 153;

/* Lines 7, 8 and 9: the count times the exemption credit; blank with no count. */
const exemptionCreditAmount = (count: unknown) =>
  typeof count === "number" ? count * CA_EXEMPTION_CREDIT_2025 : undefined;

// MANUAL EDIT: the count widget gets the count; the amount widget gets count × $153 (CA_EXEMPTION_CREDIT_2025).
export const line7PersonalExemptionCount: Form540Line<"line.7_personal_exemption_count"> = (
  _,
  info,
) =>
  info.filingStatus === "married_filing_jointly" ||
  info.filingStatus === "qualifying_surviving_spouse"
    ? 2
    : info.filingStatus
      ? 1
      : undefined;

export const line7PersonalExemptionAmount: Form540Line<"line.7_personal_exemption_amount"> = (
  form,
) => exemptionCreditAmount(form["line.7_personal_exemption_count"]);

/*
 * MANUAL EDIT: "If you (or your spouse/RDP) are visually impaired, enter 1; if
 * both are visually impaired, enter 2" (the form). Only a joint return counts
 * the spouse. Blank when no one is (ca-540-inst-2025::sec::line-8-blind-exemptions::b01).
 * Line 6 (claimed as a dependent) is not modeled, as for line 7.
 */
export const line8BlindExemptionCount: Form540Line<"line.8_blind_exemption_count"> = (_, info) => {
  const count =
    (info.taxpayerBlind ? 1 : 0) +
    (info.filingStatus === "married_filing_jointly" && info.spouseBlind ? 1 : 0);
  return count > 0 ? count : undefined;
};

export const line8BlindExemptionAmount: Form540Line<"line.8_blind_exemption_amount"> = (form) =>
  exemptionCreditAmount(form["line.8_blind_exemption_count"]);

/*
 * MANUAL EDIT: 65 or older on December 31, 2025: "If you are married/or an RDP,
 * each spouse/RDP 65 years of age or older should claim an additional credit"
 * (ca-540-inst-2025::sec::line-9-senior-exemptions::b01). Only a joint return
 * counts the spouse. It waits for each date of birth it reads. A qualifying
 * surviving spouse is unmarried in 2025, so only the taxpayer counts.
 */
export const line9SeniorExemptionCount: Form540Line<"line.9_senior_exemption_count"> = (
  _,
  info,
) => {
  const joint = info.filingStatus === "married_filing_jointly";
  if (info.taxpayerBornBeforeJan2_1961 === undefined) return undefined;
  if (joint && info.spouseBornBeforeJan2_1961 === undefined) return undefined;
  const count =
    (info.taxpayerBornBeforeJan2_1961 === true ? 1 : 0) +
    (joint && info.spouseBornBeforeJan2_1961 === true ? 1 : 0);
  return count > 0 ? count : undefined;
};

export const line9SeniorExemptionAmount: Form540Line<"line.9_senior_exemption_amount"> = (form) =>
  exemptionCreditAmount(form["line.9_senior_exemption_count"]);

/*
 * MANUAL EDIT: line 10's Dependents table, rows 1 to 3, one row per dependent
 * fact in the order recorded (the same persons as the federal return). A row
 * with no dependent stays blank; a fourth dependent needs an attached statement.
 */
type DependentRow = 1 | 2 | 3;
type DependentColumn = "first_name" | "last_name" | "ssn" | "relationship";
type DependentRowLine = BindingFn<
  Form540,
  Form540FilingInfo,
  `dependents.dep${DependentRow}_${DependentColumn}`
>;

const dependentInRow = (row: DependentRow, info: Form540FilingInfo) =>
  info.dependents?.[row - 1]?.dependent;

// MANUAL EDIT: the SSN, else the ITIN ("SSN or ITIN", line 10 instructions), as nine digits for the formatter.
function dependentTin(dep: DependentFactValue | undefined) {
  const raw = dep?.ssn ?? dep?.tin;
  return raw === undefined ? undefined : ssn(raw);
}

export const line10DependentFirstName =
  (row: DependentRow): DependentRowLine =>
  (_, info) =>
    dependentInRow(row, info)?.firstName;
export const line10DependentLastName =
  (row: DependentRow): DependentRowLine =>
  (_, info) =>
    dependentInRow(row, info)?.lastName;
export const line10DependentSsn =
  (row: DependentRow): DependentRowLine =>
  (_, info) =>
    dependentTin(dependentInRow(row, info));
export const line10DependentRelationship =
  (row: DependentRow): DependentRowLine =>
  (_, info) =>
    dependentInRow(row, info)?.relationship;

/*
 * MANUAL EDIT: "Count the number of dependents listed and enter the total
 * in the box on line 10. Multiply the number you entered by the
 * pre-printed dollar amount" (ca-540-inst-2025::sec::line-10-dependent-exemptions::b01).
 * No dependents: both widgets stay blank.
 */
export const line10DependentExemptionCount: Form540Line<"line.10_dependent_exemption_count"> = (
  _,
  info,
) => (info.dependents && info.dependents.length > 0 ? info.dependents.length : undefined);

export const line10DependentExemptionAmount: Form540Line<"line.10_dependent_exemption_amount"> = (
  form,
) => {
  const count = form["line.10_dependent_exemption_count"];
  return typeof count === "number" ? count * CA_DEPENDENT_EXEMPTION_2025 : undefined;
};

export const line11TotalExemptionAmount: Form540Line<"line.11_total_exemption_amount"> = (form) =>
  sum(
    form["line.7_personal_exemption_amount"],
    form["line.8_blind_exemption_amount"],
    form["line.9_senior_exemption_amount"],
    form["line.10_dependent_exemption_amount"],
  );
