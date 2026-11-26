/*
 * FTB 3507, Prison Inmate Labor Credit. Lines 1 to 5 add the credit from the
 * stated wages, the pass-through credits and last year's carryover (lines.ts).
 * Line 6a is the credit Schedule P (540) line 4 lets the return use
 * (creditUsed.ts). Lines 6c and 7 split the part the $5,000,000 limit
 * disallowed; the credit the tax could not use is lost (the DECISION above
 * line 7).
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
 * The part of line 5 the $5,000,000 limit disallows (lines.ts), or line 6a's
 * gap; undefined while it waits. Schedule P (540) line 3 is the excess tax the
 * credit may offset.
 */
function disallowed(form: Form, info: Info): number | Unsupported | undefined {
  const used = claimed(form, info);
  const credit = available(info);
  if (isGap(used)) return used;
  if (used === undefined || credit === undefined) return undefined;
  if (credit <= 0) return 0;
  const excess = numberOrBlank(form[SCHEDULE_P_EXCESS_TAX]);
  return excess === undefined ? undefined : disallowedByLimit(credit, excess);
}

/*
 * Line 6c: with the FTB 3870 election, the disallowed part. The election is
 * asked only when line 5 is above the limit; below it nothing is disallowed.
 */
function refundable(form: Form, info: Info): number | Unsupported | undefined {
  const part = disallowed(form, info);
  if (typeof part !== "number") return part;
  if (part <= 0) return 0;
  const elects = info.businessCreditRefundableElection;
  return elects === undefined ? undefined : line6c(part, elects);
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
   * DECISION (2026-11-26, by the author): line 7 holds only the part of the
   * credit that the $5,000,000 business credit limitation disallowed and that
   * line 6c does not make refundable. The credit the tax could not use is lost.
   * - Text A, the texts written for this credit. The form's credit limitation
   *   text: "Reminder: Generally, there is no provision for carryover of any
   *   unused Prison Inmate Labor Credit to succeeding taxable years, and in no
   *   event can taxpayers carry this back and apply it against a prior year's
   *   tax. However, for taxable years 2024 through 2026, taxpayers are allowed
   *   to carryover the amount of credit disallowed due to the $5,000,000
   *   business credit limitation" (ca-3507-form-2025::sec::credit-limitation::b02).
   *   The Schedule P (540) face lists the credit under "A1 Credits that reduce
   *   excess tax and have no carryover provisions"
   *   (ca-540-sched-p-face-2025::sec::face-part-iii::b01), and its instructions
   *   say "only the disallowed portion of the credit may be carried over"
   *   (ca-540-sched-p-inst-2025::sec::section-a1-instructions::b01).
   * - Text B, the line 7 instruction: "Credit limited by your tax liability
   *   cannot be included in an election for refundable credit. ... They can,
   *   however, be carried over for future years. Include any such amounts here"
   *   (ca-3507-form-2025::sec::line-7::b01), and the form: "Add lines 6a, 6b,
   *   and 6c, subtract the result from line 5."
   * - The law, as the lead read R&TC section 17053.6 from a public copy
   *   (california.public.law, 2026-11-26; the California code is not in the
   *   library): subdivision (a) allows a credit of "10 percent of the amount of
   *   wages paid or incurred during the taxable year" for each prisoner employed
   *   in a joint venture program, against the net tax, and subdivision (b) has
   *   a yearly list of employers sent to the Franchise Tax Board. The section
   *   has no carryover provision.
   * The engine follows Text A: the statute gives this credit no carryover, the
   * form's own limitation text and Schedule P agree, and the line 7
   * instruction's general sentence would carry forward a credit the law lets
   * expire. No 2025 tax changes; the made-up taxpayer katerine carries $0 to
   * 2026, not $2,733. Line 7 prints 0 when nothing carries, as lines 6b and 6c
   * do: it is next year's line 4, and a 0 says that nothing carries.
   */
  "0.line.7_disallowed_credit_carryover": (form, info) => {
    const part = disallowed(form, info);
    const elected = refundable(form, info);
    if (typeof part !== "number") return part;
    if (typeof elected !== "number") return elected;
    return line7(part, elected);
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
