/*
 * Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:.
 * Lines 2–5 describe the qualifying person (qualifyingPerson.ts).
 */

import { defineForm, type FormSpec } from "../../../defineForm.js";
import { roundDollars } from "../../../money.js";
import { unsupported } from "../../../types.js";
import { ssnOf } from "../../../values.js";
import type { Form3532FilingInfo } from "./filingInfo.js";
import {
  asksLines3aAnd3b,
  daysLivedWithTaxpayer,
  fullTimeStudentUnder24,
  relationshipBox,
  type QualifyingPerson,
} from "./qualifyingPerson.js";
import type { Form3532 } from "./types.js";

type Bindings = FormSpec<Form3532, Form3532FilingInfo>["bindings"];
type Info = Form3532FilingInfo;

const yesNo = (answer: boolean | undefined) =>
  answer === undefined ? undefined : answer ? "yes" : "no";

/* The qualifying person's line, or unsupported when the engine cannot name the person. */
const fromPerson =
  <T>(line: (person: QualifyingPerson, info: Info) => T) =>
  (_: unknown, info: Info) => {
    if (info.hohQualifyingPersonGap) return unsupported(info.hohQualifyingPersonGap);
    return info.hohQualifyingPerson ? line(info.hohQualifyingPerson, info) : undefined;
  };

/*
 * Line 1f: "List the beginning and ending dates for each period when you lived
 * together" (the form), only with box f. The form has room for two periods.
 */
const livedTogetherDate = (index: number, end: "from" | "to") => (_: unknown, info: Info) => {
  if (info.hohMaritalStatus !== "married_lived_together") return undefined;
  const periods = info.livedWithSpousePeriods;
  if (periods && periods.length > 2) {
    return unsupported(
      "Line 1f has room for two periods; a third period has no place on the form.",
    );
  }
  return periods?.[index]?.[end];
};

const partI: Bindings = {
  // MANUAL EDIT: "Name(s) as shown on tax return"; head of household is one filer.
  "0.header.name": (_, info) =>
    info.taxpayerFirstName && info.taxpayerLastName
      ? `${info.taxpayerFirstName} ${info.taxpayerLastName}`
      : undefined,
  "0.header.ssn": (_, info) => info.taxpayerSSN,
  // Line 1: the box for the stated marital status (ca-3532-inst-2025::sec::line-1::b01).
  "0.line.1_marital_status": (_, info) => info.hohMaritalStatus,
  "0.line.1f_from_1": livedTogetherDate(0, "from"),
  "0.line.1f_to_1": livedTogetherDate(0, "to"),
  "0.line.1f_from_2": livedTogetherDate(1, "from"),
  "0.line.1f_to_2": livedTogetherDate(1, "to"),
};

const partsIIAndIII: Bindings = {
  /*
   * Line 2: the box for the qualifying person's relationship
   * (ca-3532-inst-2025::sec::line-2::b01). A relationship no box lists needs a person.
   */
  "0.line.2_qualifying_person_relationship": fromPerson(({ dependent }) => {
    const box = relationshipBox(dependent.relationship);
    return (
      box ??
      unsupported(
        `No line 2 box lists the relationship "${dependent.relationship}"; a person checks the box.`,
      )
    );
  }),
  // Line 3: name, SSN (or ITIN) and date of birth (ca-3532-inst-2025::sec::line-3::b01).
  "0.line.3_first_name": fromPerson(({ dependent }) => dependent.firstName),
  "0.line.3_last_name": fromPerson(({ dependent }) => dependent.lastName),
  "0.line.3_ssn": fromPerson(({ dependent }) => ssnOf(dependent.ssn ?? dependent.tin)),
  "0.line.3_date_of_birth": fromPerson(({ dependent }) => dependent.dob),
  // Lines 3a and 3b only for a person age 19 or older in 2025 (the form, line 3).
  "0.line.3a_full_time_student_under_24": fromPerson(({ dependent }) =>
    asksLines3aAnd3b(dependent) ? yesNo(fullTimeStudentUnder24(dependent)) : undefined,
  ),
  "0.line.3b_permanently_disabled": fromPerson(({ dependent }) =>
    asksLines3aAnd3b(dependent) ? yesNo(dependent.permanentlyDisabled) : undefined,
  ),
  // Line 4: the person's gross income (ca-3532-inst-2025::sec::line-4::b01).
  "0.line.4_gross_income": fromPerson(({ dependent }) => roundDollars(dependent.grossIncome)),
  // Line 5: the days the person lived with the taxpayer (ca-3532-inst-2025::sec::line-5::b02).
  "0.line.5_days_lived_with_you": fromPerson(({ dependent }, info) =>
    daysLivedWithTaxpayer(dependent, info.hohMaritalStatus),
  ),
};

export function register(): void {
  defineForm<Form3532, Form3532FilingInfo>("form-3532", {
    bindings: { ...partI, ...partsIIAndIII },
  });
}
