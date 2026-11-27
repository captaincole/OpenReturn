/*
 * Part IV, the American opportunity credit (irs-8862-inst-2025, lines 18–19).
 * Filled only when line 2's AOTC box is checked. The students are those Form
 * 8863 gives the AOTC, "as listed on Form 8863", and lines 19a and 19b answer
 * from the same student facts as Form 8863 lines 23–26.
 */

import { unsupported } from "../../types.js";
import type { StudentPartIII } from "../8863/filingInfo.js";
import type { Form8862FilingInfo } from "./filingInfo.js";
import { line19aEligible, line19bClaimedFourYears, STUDENT_COLUMNS } from "./lines.js";
import { columns, yesNo, type Binding, type Bindings, type Form } from "./pairs.js";

const MORE_STUDENTS_GAP =
  "Line 18: more than three students need an attached statement answering lines 18 and 19 for the others, and the engine writes no statements.";

const LETTERS = ["a", "b", "c"];

function students(form: Form, info: Form8862FilingInfo): StudentPartIII[] | undefined {
  if (form["0.line.2_claiming_aotc"] !== true) return undefined;
  return (info.form8863?.students ?? []).filter((each) => each.credit === "american_opportunity");
}

function studentBindings(column: number): Record<string, Binding> {
  const student = (form: Form, info: Form8862FilingInfo) => students(form, info)?.[column - 1];
  const read =
    (rule: (each: StudentPartIII) => boolean) => (form: Form, info: Form8862FilingInfo) => {
      const each = student(form, info);
      return each === undefined ? undefined : rule(each);
    };
  return {
    [`2.line.18${LETTERS[column - 1]}_student_${column}_name`]: (
      form: Form,
      info: Form8862FilingInfo,
    ) => {
      const listed = students(form, info);
      if (listed === undefined) return undefined;
      if (column === STUDENT_COLUMNS && listed.length > STUDENT_COLUMNS) {
        return unsupported(MORE_STUDENTS_GAP);
      }
      return listed[column - 1]?.name;
    },
    ...yesNo(
      `2.line.19a_student_${column}_eligible_yes`,
      `2.line.19a_student_${column}_eligible_no`,
      read(line19aEligible),
    ),
    ...yesNo(
      `2.line.19b_student_${column}_prior_four_years_yes`,
      `2.line.19b_student_${column}_prior_four_years_no`,
      read(line19bClaimedFourYears),
    ),
  };
}

export function partIVBindings(): Bindings {
  return Object.assign({}, ...columns(STUDENT_COLUMNS).map(studentBindings)) as Bindings;
}
