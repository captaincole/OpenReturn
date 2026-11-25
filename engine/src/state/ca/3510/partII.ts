/*
 * FTB 3510 Part II lines 33 to 39: the 2025 limit on the credit. They read
 * Form 540 and Schedule P (540), and are figured only when line 32 is above 0
 * (ca-3510-inst-2025::sec::specific-line-instructions::b04: "Do not complete
 * the rest of this form").
 */

import type { BindingFn, FormAccessor } from "../../../defineForm.js";
import { numberOrBlank, sum } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import type { Form3510FilingInfo } from "./filingInfo.js";
import { figureCreditAllowed, type CreditAllowedLines } from "./lines.js";
import type { Form3510 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form3510]: BindingFn<Form3510, Form3510FilingInfo, K> }>;
type Form = FormAccessor<Form3510>;
type Info = Form3510FilingInfo;

const NONRESIDENT_RETURN = unsupported(
  "A 2025 Form 540NR filer reads Form 540NR line 37 and Schedule P (540NR) Part II line 43 and Part III column (b), and Schedule P (540NR) has no rules yet.",
);
const NO_SCHEDULE_P = unsupported(
  "Line 36 needs the 2025 Schedule P (540) through line 24 (ca-3510-inst-2025::sec::specific-line-instructions::b01), and the return does not complete it.",
);

/*
 * Line 34, residents (ca-3510-inst-2025::sec::specific-line-instructions::b05):
 * the exemption credits on Form 540 line 32, and the other credits in Schedule
 * P (540) Section A1 and A2, column (b). The credit for prior year AMT is
 * Section A2 line 10 itself, so it is not one of the "other" credits.
 */
const OTHER_SECTION_A_CREDITS = [
  "schedule-p.1.part3.4_prison_inmate_labor_credit_col_b",
  "schedule-p.1.part3.5_child_dependent_care_credit_col_b",
  "schedule-p.2.part3.6_credit_used_col_b",
  "schedule-p.2.part3.7_credit_used_col_b",
  "schedule-p.2.part3.8_credit_used_col_b",
  "schedule-p.2.part3.9_credit_used_col_b",
];

/* Line 32, when it is above 0; undefined otherwise or while it waits. */
function line32(form: Form): number | undefined {
  const amount = numberOrBlank(form["0.line.32_combine_lines_30_and_31"]);
  return amount !== undefined && amount > 0 ? amount : undefined;
}

export function creditAllowed(
  form: Form,
  info: Info,
): CreditAllowedLines | Unsupported | undefined {
  const available = line32(form);
  if (available === undefined) return undefined;
  if (info.mustFile?.["form-540nr"]?.value === true) return NONRESIDENT_RETURN;
  if (info.mustFile?.["schedule-p"]?.value !== true) return NO_SCHEDULE_P;
  // Line 33: Form 540 line 31. Line 36: Schedule P (540) Part II line 24 (::b05).
  const line33 = numberOrBlank(form["form-540.line.31_tax_amount"]);
  const line36 = numberOrBlank(form["schedule-p.1.line.24_tentative_minimum_tax"]);
  if (line33 === undefined || line36 === undefined) return undefined;
  const line34 = sum(
    form["form-540.line.32_exemption_credits"],
    ...OTHER_SECTION_A_CREDITS.map((id) => form[id]),
  );
  return figureCreditAllowed(available, line33, line34, line36);
}

const fromAllowed =
  (pick: (lines: CreditAllowedLines) => number) =>
  (form: Form, info: Info): number | Unsupported | undefined => {
    const lines = creditAllowed(form, info);
    return lines === undefined || "unsupported" in lines ? lines : pick(lines);
  };

export function creditAllowedBindings(): Bindings {
  return {
    "0.line.33_current_year_regular_tax": fromAllowed((lines) => lines.line33),
    "0.line.34_exemption_other_allowable_credits": fromAllowed((lines) => lines.line34),
    "0.line.35_regular_tax_less_credits": fromAllowed((lines) => lines.line35),
    "0.line.36_current_year_tentative_minimum_tax": fromAllowed((lines) => lines.line36),
    "0.line.37_line_35_minus_line_36": fromAllowed((lines) => lines.line37),
    "0.line.38_prior_year_amt_credit": fromAllowed((lines) => lines.line38),
    "0.line.39_amt_credit_carryover_to_2026": fromAllowed((lines) => lines.line39),
  };
}
