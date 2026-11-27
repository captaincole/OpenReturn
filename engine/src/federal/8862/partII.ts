/*
 * Part II, the earned income credit (irs-8862-inst-2025, lines 3–11). The
 * part is filled only when line 2's EIC box is checked; line 3 "Yes" ends it
 * ("do not complete the rest of Part II"). Section A is for a filer with a
 * qualifying child on Schedule EIC, Section B for a filer without one (the
 * form face: "If you are claiming the EIC with a qualifying child, continue
 * to Section A. Otherwise, go to Section B").
 */

import { unsupported } from "../../types.js";
import type { EicChildColumn, Form8862EicPart } from "./eicPart.js";
import type { Form8862FilingInfo } from "./filingInfo.js";
import { EIC_CHILD_COLUMNS } from "./lines.js";
import { columns, yesNo, type Binding, type Bindings, type Form } from "./pairs.js";

const SPOUSE_DIED_GAP =
  "Line 10b: a spouse who died during 2025 meets the age test by the age at death (irs-8862-inst-2025::sec::line-10::b01), and no fact holds the date of death.";

/* Part II, when line 2 claims the EIC. */
function claimed(form: Form, info: Form8862FilingInfo): Form8862EicPart | undefined {
  return form["0.line.2_claiming_eic"] === true ? info.form8862?.eic : undefined;
}

/* After line 3 "No": lines 4 to 11. */
function pastLine3(form: Form, info: Form8862FilingInfo): Form8862EicPart | undefined {
  const part = claimed(form, info);
  return part?.line3 === false ? part : undefined;
}

const sectionA = (form: Form, info: Form8862FilingInfo) => {
  const part = pastLine3(form, info);
  return part?.sectionB === false ? part : undefined;
};
const sectionB = (form: Form, info: Form8862FilingInfo) => {
  const part = pastLine3(form, info);
  return part?.sectionB === true ? part : undefined;
};

/* Line 5, 7 and 8 for one Schedule EIC column. */
function childBindings(column: number): Record<string, Binding> {
  const child = (form: Form, info: Form8862FilingInfo): EicChildColumn | undefined =>
    sectionA(form, info)?.children[column - 1];
  const letter = ["a", "b", "c"][column - 1];
  return {
    [`0.line.5${letter}_child_${column}_name`]: (form, info) => child(form, info)?.name,
    [`0.line.7_days_lived_in_us_child_${column}`]: (form, info) => child(form, info)?.days,
    [`0.line.8_child_${column}_birth_month`]: (form, info) => child(form, info)?.birth?.month,
    [`0.line.8_child_${column}_birth_day`]: (form, info) => child(form, info)?.birth?.day,
    [`0.line.8_child_${column}_death_month`]: (form, info) => child(form, info)?.death?.month,
    [`0.line.8_child_${column}_death_day`]: (form, info) => child(form, info)?.death?.day,
  };
}

/* Line 10b: the spouse's age; a spouse who died in 2025 is a gap. */
function line10b(form: Form, info: Form8862FilingInfo) {
  const part = sectionB(form, info);
  if (part?.spouseDiedThisYear) return unsupported(SPOUSE_DIED_GAP);
  return part?.line10b;
}

export function partIIBindings(): Bindings {
  const bindings: Record<string, Binding> = {
    ...yesNo(
      "0.line.3_eic_only_income_misreported_yes",
      "0.line.3_eic_only_income_misreported_no",
      (form, info) => claimed(form, info)?.line3,
    ),
    ...yesNo(
      "0.line.4_qualifying_child_of_another_yes",
      "0.line.4_qualifying_child_of_another_no",
      (form, info) => pastLine3(form, info)?.line4,
    ),
    // Line 6: a filer in Section A has a qualifying child on Schedule EIC.
    ...yesNo(
      "0.line.6_schedule_eic_qualifying_child_yes",
      "0.line.6_schedule_eic_qualifying_child_no",
      (form, info) => (sectionA(form, info) === undefined ? undefined : true),
    ),
    ...Object.assign({}, ...columns(EIC_CHILD_COLUMNS).map(childBindings)),
    "1.line.9a_days_main_home_us": (form, info) => sectionB(form, info)?.line9a,
    "1.line.9b_spouse_days_main_home_us": (form, info) => sectionB(form, info)?.line9b,
    "1.line.10a_your_age_year_end": (form, info) => sectionB(form, info)?.line10a,
    "1.line.10b_spouse_age_year_end": line10b,
    ...yesNo(
      "1.line.11a_you_claimed_as_dependent_yes",
      "1.line.11a_you_claimed_as_dependent_no",
      (form, info) => sectionB(form, info)?.line11a,
    ),
    ...yesNo(
      "1.line.11b_spouse_claimed_as_dependent_yes",
      "1.line.11b_spouse_claimed_as_dependent_no",
      (form, info) => sectionB(form, info)?.line11b,
    ),
  };
  return bindings as Bindings;
}
