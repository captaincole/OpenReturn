/*
 * FTB 3507, Prison Inmate Labor Credit. Lines 1 to 5 add the credit from the
 * stated wages, the pass-through credits and last year's carryover (lines.ts).
 * Line 6a is the credit Schedule P (540) line 4 lets the return use
 * (creditUsed.ts); lines 6b, 6c and 7 split the rest.
 */

import { defineForm, type BindingFn, type FormAccessor } from "../../../defineForm.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { numberOrBlank } from "../../../money.js";
import type { Unsupported } from "../../../types.js";
import { prisonLaborCreditClaimed, SCHEDULE_P_EXCESS_TAX } from "./creditUsed.js";
import type { Form3507FilingInfo } from "./filingInfo.js";
import {
  ASSIGNED_CREDIT_OF_AN_INDIVIDUAL,
  disallowedByLimit,
  line1,
  line2,
  line3,
  line4,
  line5,
  line6c,
  line7,
} from "./lines.js";
import type { Form3507 } from "./types.js";

type Info = Form3507FilingInfo;
type Form = FormAccessor<Form3507>;
type Bindings = Partial<{ [K in keyof Form3507]: BindingFn<Form3507, Info, K> }>;

/* Every stated pass-through credit, or undefined while one waits. */
function passThroughCredits(info: Info): number[] | undefined {
  const credits = (info.prisonLaborPassThroughRows ?? []).map((row) => row.credit);
  return credits.every((credit) => credit !== undefined) ? (credits as number[]) : undefined;
}

function available(info: Info): number | undefined {
  const wages = info.prisonLaborWages;
  const credits = passThroughCredits(info);
  const carryover = info.prisonLaborCarryover;
  if (wages === undefined || credits === undefined || carryover === undefined) return undefined;
  return line5(wages, credits, carryover);
}

const isGap = (value: unknown): value is Unsupported =>
  typeof value === "object" && value !== null && "unsupported" in value;

/* Line 6a, or its gap; undefined while it waits. */
function claimed(form: Form, info: Info): number | Unsupported | undefined {
  const credit = available(info);
  if (credit === undefined) return undefined;
  return prisonLaborCreditClaimed((fieldId) => form[fieldId], info, credit);
}

/*
 * Line 6c: with the FTB 3870 election, the part the $5,000,000 limit disallows
 * (lines.ts). Schedule P (540) line 3 is the excess tax the credit may offset.
 * The election is asked only when line 5 is above the limit; below it nothing
 * is disallowed.
 */
function refundable(form: Form, info: Info): number | Unsupported | undefined {
  const used = claimed(form, info);
  const credit = available(info);
  if (used === undefined || isGap(used) || credit === undefined) return used;
  if (credit <= 0) return 0;
  const excess = numberOrBlank(form[SCHEDULE_P_EXCESS_TAX]);
  if (excess === undefined) return undefined;
  const disallowed = disallowedByLimit(credit, excess);
  if (disallowed <= 0) return 0;
  const elects = info.businessCreditRefundableElection;
  return elects === undefined ? undefined : line6c(disallowed, elects);
}

const lines: Bindings = {
  "0.line.1_total_qualifying_wages": (_, info) => {
    const wages = info.prisonLaborWages;
    return wages === undefined ? undefined : line1(wages);
  },
  "0.line.2_current_year_credit": (_, info) => {
    const wages = info.prisonLaborWages;
    return wages === undefined ? undefined : line2(wages);
  },
  "0.line.3_pass_through_credit_k1": (_, info) => {
    const credits = passThroughCredits(info);
    return credits === undefined ? undefined : line3(credits);
  },
  "0.line.4_credit_carryover_prior_year": (_, info) => {
    const carryover = info.prisonLaborCarryover;
    return carryover === undefined ? undefined : line4(carryover);
  },
  "0.line.5_total_available_credit": (_, info) => available(info),
  "0.line.6a_credit_claimed": (form, info) => claimed(form, info),
  // "If you are not a corporation, enter -0-" (the form; ca-3507-form-2025::sec::line-6b::b01).
  "0.line.6b_total_credit_assigned": () => ASSIGNED_CREDIT_OF_AN_INDIVIDUAL,
  "0.line.6c_credit_elected_refundable": (form, info) => refundable(form, info),
  /*
   * DECISION (2026-11-26, by the author): line 7 keeps the credit that the tax
   * could not use, not only the part the $5,000,000 limit disallowed.
   * - Text A, the reminder in General Information: "Generally, there is no
   *   provision for carryover of any unused Prison Inmate Labor Credit ...
   *   However, for taxable years 2024 through 2026, taxpayers are allowed to
   *   carryover the amount of credit disallowed due to the $5,000,000 business
   *   credit limitation" (ca-3507-form-2025::sec::credit-limitation::b02); and
   *   Schedule P (540): "only the disallowed portion of the credit may be
   *   carried over" (ca-540-sched-p-inst-2025::sec::section-a1-instructions::b01),
   *   whose face heads the row "A1 Credits that reduce excess tax and have no
   *   carryover provisions" (ca-540-sched-p-face-2025::sec::face-part-iii::b01).
   * - Text B, the line 7 instruction: "Credit limited by your tax liability ...
   *   can, however, be carried over for future years. Include any such amounts
   *   here" (ca-3507-form-2025::sec::line-7::b01), and the form: "Add lines 6a,
   *   6b, and 6c, subtract the result from line 5."
   * The engine follows Text B: the form's arithmetic wins over a sentence that
   * breaks it, and the line's own instruction agrees with the arithmetic.
   */
  "0.line.7_disallowed_credit_carryover": (form, info) => {
    const credit = available(info);
    const used = claimed(form, info);
    const elected = refundable(form, info);
    if (isGap(used)) return used;
    if (isGap(elected)) return elected;
    if (credit === undefined || used === undefined || elected === undefined) return undefined;
    return line7(credit, used, ASSIGNED_CREDIT_OF_AN_INDIVIDUAL, elected);
  },
};

/*
 * The header: the names on the return and the taxpayer's number. An
 * individual files with an SSN or ITIN; the Secretary of State file number is
 * for an LLC or a corporation, so it is blank.
 */
const header: Bindings = {
  "0.header.id_number_type": () => "ssn_or_itin",
  "0.header.id_number": (_, info) => info.taxpayerSSN,
  "0.header.name_on_return": (_, info) => namesOnReturn(info),
  "0.header.sos_file_number": () => undefined,
};

export function register(): void {
  defineForm<Form3507, Form3507FilingInfo>("form-3507", { bindings: { ...header, ...lines } });
}
