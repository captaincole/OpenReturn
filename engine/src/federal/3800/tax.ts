/*
 * Form 3800 Part II lines 7, 8, 10a, 10b and 14: the amounts of tax and of
 * other credits the return figures. Every function reads cross-form fields by
 * their full id.
 */

import { atLeast, numberOrBlank, sum, sumOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { claimsByElection, foreignTaxCredit } from "../1116/credit.js";
import { isGap } from "../1116/lines.js";
import { dependentCareCreditGap } from "../2441/creditGap.js";
import { amtGap } from "../6251/foreignTaxCredit.js";
import { mortgageCreditGap } from "../8396/creditGap.js";
import type { Form8621FilingInfo } from "../8621/filingInfo.js";
import { form8621Amount } from "../8621/totals.js";
import { line6cFrom8839 } from "../8839/receivers.js";
import { nonrefundableCreditGap } from "../8863/credit.js";
import { creditGap } from "../8880/credit.js";
import { refuelingCreditGap, type Form8911CreditInfo } from "../8911/credit.js";
import { cleanVehicleCreditGap } from "../8936/credit.js";
import type { Form8936FilingInfo } from "../8936/filingInfo.js";
import type { Cell } from "./cells.js";
import type { Form3800FilingInfo } from "./filingInfo.js";
import type { TaxInputs } from "./lines.js";

export type Accessor = { readonly [fieldId: string]: unknown };

/* Every slot Form 3800 reads. */
export type Form3800Info = Form3800FilingInfo &
  Form8911CreditInfo &
  Form8936FilingInfo &
  Pick<Form8621FilingInfo, "form8621Totals">;

const files = (info: Form3800Info, formId: string) => info.mustFile?.[formId]?.value === true;

/*
 * Line 7 (irs-3800-inst-2025::sec::line-7::b01): Form 1040 line 16 and Schedule
 * 2 line 1z. "Don't include ... any tax from Form 8621": its section 1291 tax is
 * in line 16 (1040/taxAndCredits.ts). The engine models no education credit
 * recapture or section 965(i) amount.
 */
export function line7Of(form: Accessor, info: Form3800Info): number | Unsupported | undefined {
  const line16 = numberOrBlank(form["form-1040.line.16"]);
  if (line16 === undefined) return undefined;
  const totals = info.form8621Totals;
  if (totals?.gap !== undefined) return unsupported(totals.gap);
  const pficTax = form8621Amount(totals, (amounts) => amounts.section1291Tax);
  return atLeast(
    0,
    line16 + sum(form["schedule-2.0.line.1z_total_lines_1a_through_1y"]) - sum(pficTax),
  );
}

/* Line 8: Form 6251 line 11; blank when Form 6251 does not file. A gap in line 11 is a gap here. */
export function line8Of(form: Accessor, info: Form3800Info): Cell | "waiting" {
  if (!files(info, "form-6251")) return undefined;
  const gap = amtGap(form, info);
  if (gap) return gap;
  const amt = numberOrBlank(form["form-6251.0.line.11_amt"]);
  return amt === undefined ? "waiting" : amt;
}

/*
 * Line 10b (line-10b::b01): Form 1040 line 19 and Schedule 3 lines 2 through
 * 4, 5a, 5b and 7, without the general business credit (6a), the credit for
 * prior-year minimum tax (6b) or Form 8912 (6k). Line 6e is reserved.
 */
const LINE_10B_CREDITS = [
  "form-1040.line.19",
  "schedule-3.0.line.2",
  "schedule-3.0.line.3",
  "schedule-3.0.line.4",
  "schedule-3.0.line.5a",
  "schedule-3.0.line.5b",
  "schedule-3.0.line.6c",
  "schedule-3.0.line.6d",
  "schedule-3.0.line.6f",
  "schedule-3.0.line.6g",
  "schedule-3.0.line.6h",
  "schedule-3.0.line.6i",
  "schedule-3.0.line.6j",
  "schedule-3.0.line.6l",
  "schedule-3.0.line.6m",
  "schedule-3.0.line.6z_amount",
] as const;

/* Schedule 3 lines the engine does not compute while their form files (as Form 8911 line 6b). */
const UNCOMPUTED_CREDITS: ReadonlyArray<[formId: string, line: string]> = [
  ["form-5695", "Schedule 3 line 5a (Form 5695 Part I, the residential clean energy credit)"],
  ["form-8859", "Schedule 3 line 6h (Form 8859)"],
  ["form-8834", "Schedule 3 line 6i (Form 8834)"],
  ["form-8978", "Schedule 3 line 6l (Form 8978)"],
];

function otherCreditsGap(form: Accessor, info: Form3800Info): string | undefined {
  const uncomputed = UNCOMPUTED_CREDITS.find(([formId]) => files(info, formId));
  if (uncomputed) return `Line 10b adds ${uncomputed[1]}, which the engine does not compute.`;
  const adoption = line6cFrom8839(form, info)?.value;
  const gaps = [
    dependentCareCreditGap(form, info),
    nonrefundableCreditGap(form, info)?.reason,
    creditGap(form, info)?.reason,
    typeof adoption === "object" ? adoption.reason : undefined,
    cleanVehicleCreditGap(form, info),
    mortgageCreditGap(form, info),
    refuelingCreditGap(form, info),
  ];
  const found = gaps.find((reason) => reason !== undefined);
  return found === undefined
    ? undefined
    : `Line 10b adds a credit the engine cannot figure: ${found}`;
}

export function line10bOf(form: Accessor, info: Form3800Info): Cell {
  const reason = otherCreditsGap(form, info);
  if (reason !== undefined) return unsupported(reason);
  return sumOrBlank(...LINE_10B_CREDITS.map((id) => form[id]));
}

const FORM_6251_LINE_7 = "form-6251.0.line.7_tax_on_line_6";
const NO_FORM_6251 =
  "Line 14 is Form 6251 line 9, and Form 6251 does not file (decisions.scope.must_file_6251 is false, or no credit outside the specified credits files it).";
const AMT_COPY_GAP =
  "Form 1116 files: line 14 is Form 6251 line 7 less the AMT foreign tax credit, which is figured on a second set of Forms 1116 with AMT amounts (irs-6251-inst-2025::sec::line-8-alternative-minimum-tax-foreign-tax::b01), and the engine does not figure that set.";

/*
 * Line 14, the tentative minimum tax: Form 6251 line 7 less the AMT foreign tax
 * credit, never below 0.
 *
 * DECISION (2026-11-25, by the author): line 14 is the tentative minimum tax
 * after the AMT foreign tax credit, also when Form 6251 leaves its line 8 blank.
 * - Form 3800 line 14: "Individuals. Enter the amount from Form 6251, line 9"
 *   (irs-3800-face-2025::sec::face-part-ii::b02); Form 6251 line 9 is line 7
 *   less line 8.
 * - Form 6251 instructions: "If the amount on line 10 is greater than or equal
 *   to the amount on line 7 ... Leave line 8 blank"
 *   (irs-6251-inst-2025::sec::line-8-alternative-minimum-tax-foreign-tax::b01).
 * The engine takes line 7 less the credit line 8 would hold, as Form 8801 line
 * 23 and Form 8911 line 8 do (docs/rule-decisions.md rows 12 and A14): one rule
 * for every credit that reads the tentative minimum tax.
 */
export function line14Of(form: Accessor, info: Form3800Info): Cell | "waiting" {
  if (!files(info, "form-6251")) return unsupported(NO_FORM_6251);
  const line7 = numberOrBlank(form[FORM_6251_LINE_7]);
  if (line7 === undefined) return "waiting";
  const credit = foreignTaxCredit(form, info);
  if (isGap(credit)) return credit;
  if (info.foreignTax?.taxesWaiting === true) return "waiting";
  if (claimsByElection(info)) return atLeast(0, line7 - sum(credit));
  return files(info, "form-1116") ? unsupported(AMT_COPY_GAP) : line7;
}

/* Lines 7, 8, 10a, 10b and 14, or undefined while one waits on the return. */
export function taxInputsOf(
  form: Accessor,
  info: Form3800Info,
): TaxInputs | Unsupported | undefined {
  const line7 = line7Of(form, info);
  if (typeof line7 !== "number") return line7;
  const line8 = line8Of(form, info);
  const line14 = line14Of(form, info);
  if (line8 === "waiting" || line14 === "waiting") return undefined;
  if (info.foreignTax?.taxesWaiting === true) return undefined;
  const line10a = foreignTaxCredit(form, info);
  return { line7, line8, line10a, line10b: line10bOf(form, info), line14 };
}
