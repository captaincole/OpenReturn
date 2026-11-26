/*
 * Part III: each item of the joint return in column (a), the injured spouse's
 * part in column (b), the other spouse's in column (c). "Column (a) must equal
 * columns (b) + (c)" (irs-8379-face-2025::sec::face-part-iii::b01), so column
 * (c) is always (a) less (b). Every function reads other forms by full field id.
 */

import { numberOrBlank, roundDollars, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form8379FilingInfo, Form8379Inputs } from "./filingInfo.js";
import {
  additionalMedicareWithholding,
  otherSpouseShare,
  standardDeductionShares,
} from "./lines.js";

export type Accessor = { readonly [fieldId: string]: unknown };
export type Value = number | Unsupported | undefined;

export const PART_III_LINES = ["13a", "13b", "14", "15", "16", "17", "18", "19", "20"] as const;
export type PartThreeLine = (typeof PART_III_LINES)[number];

const RETURN_NOT_FIGURED =
  "Part III splits the amounts of a figured joint return, and Form 1040 line 24 or line 33 is blank (a gap or an answer still missing on Form 1040).";
const SHARE_OVER_JOINT =
  "The injured spouse's stated share is below 0 or more than the amount on the joint return (column (a) must equal columns (b) + (c)).";
const DISASTER_STANDARD_DEDUCTION =
  "Line 15: the standard deduction is increased by a net qualified disaster loss (Schedule A line 16), and the Form 8379 instructions give no rule to split that increase (irs-8379-inst-2025::sec::line-15::b01).";
const PAYMENTS_NOT_AGREED =
  "Line 20: spouses who do not agree split joint estimated tax payments by each spouse's separate tax liability (irs-8379-inst-2025::sec::line-20::b01), and the engine does not figure separate returns.";

const amount = (form: Accessor, id: string): number => numberOrBlank(form[id]) ?? 0;
const amounts = (form: Accessor, ids: string[]): number =>
  sum(...ids.map((id) => amount(form, id)));

/*
 * Column (a), the amounts as the joint return shows them, by the lines each
 * instruction names (irs-8379-inst-2025::sec::line-13a::b01 to ::line-20::b01).
 */
const JOINT: Record<PartThreeLine, (form: Accessor) => number> = {
  // W-2 income, Form 1040 line 1a.
  "13a": (form) => amount(form, "form-1040.line.1a"),
  // All other income, Form 1040 lines 1b to 8: line 9 less line 1a.
  "13b": (form) => amount(form, "form-1040.line.9") - amount(form, "form-1040.line.1a"),
  // Adjustments, Form 1040 line 10.
  "14": (form) => amount(form, "form-1040.line.10"),
  // Standard or itemized deductions, Form 1040 line 12 (12e).
  "15": (form) => amount(form, "form-1040.line.12e"),
  // Nonrefundable credits: Form 1040 line 19 and Schedule 3 Part I (Form 1040 line 20).
  "16": (form) => amounts(form, ["form-1040.line.19", "form-1040.line.20"]),
  "17": (form) => refundableCredits(form),
  // Other taxes: Schedule 2 line 1z and Part II (line 21).
  "18": (form) =>
    amounts(form, [
      "schedule-2.0.line.1z_total_lines_1a_through_1y",
      "schedule-2.1.line.21_total_other_taxes",
    ]),
  // Withholding: Form 1040 line 25d and Schedule 3 line 11.
  "19": (form) => amounts(form, ["form-1040.line.25d", "schedule-3.0.line.11"]),
  // Payments: Form 1040 line 26 and Schedule 3 line 10.
  "20": (form) => amounts(form, ["form-1040.line.26", "schedule-3.0.line.10"]),
};

/*
 * DECISION (2026-11-26, by the author): line 17, column (a). The line 17
 * instruction: "include any refundable tax credits (except the earned income
 * credit) ... These credits will be reported on Form 1040 or 1040-SR, lines 28
 * and 29, and in Part II of Schedule 3" (irs-8379-inst-2025::sec::line-17::b01).
 * Part II of Schedule 3 also holds line 10, the payment with an extension, and
 * line 11, the excess social security tax; the line 20 and line 19
 * instructions put those amounts on lines 20 and 19 ("Schedule 3 (Form 1040),
 * line 10", ::line-20::b01; "Schedule 3 (Form 1040), line 11", ::line-19::b01).
 * The engine leaves Schedule 3 lines 10 and 11 off line 17: one amount on two
 * lines would count it twice in the split of the refund.
 *
 * Form 1040 line 30, the refundable adoption credit (new for 2025), is a
 * refundable credit other than the earned income credit, so it counts here
 * (QUESTIONS.md).
 */
export function refundableCredits(form: Accessor): number {
  const partII = amount(form, "schedule-3.0.line.15");
  const onOtherLines = amounts(form, ["schedule-3.0.line.10", "schedule-3.0.line.11"]);
  return sum(
    amounts(form, ["form-1040.line.28", "form-1040.line.29", "form-1040.line.30"]),
    partII - onOtherLines,
  );
}

/* Column (a): the joint return must be figured first (Form 1040 lines 24 and 33). */
export function jointAmount(form: Accessor, line: PartThreeLine): Value {
  const figured =
    numberOrBlank(form["form-1040.line.24"]) !== undefined &&
    numberOrBlank(form["form-1040.line.33"]) !== undefined;
  return figured ? JOINT[line](form) : unsupported(RETURN_NOT_FIGURED);
}

type Spouses = NonNullable<Form8379Inputs["spouses"]>;

/* The Form 1040 line 12d boxes checked for the taxpayer and for the spouse. */
function boxesChecked(form: Accessor, person: "you" | "spouse"): number {
  const boxes = [
    `form-1040.line.12d_${person}_born_before_jan2_1961`,
    `form-1040.line.12d_${person}_blind`,
  ];
  return boxes.filter((id) => form[id] === true).length;
}

/*
 * Line 15, column (b): with the standard deduction, half the basic standard
 * deduction and the injured spouse's additional amount (lines.ts); itemizing,
 * the injured spouse's stated deductions (irs-8379-inst-2025::sec::basic-standard-deduction::b02).
 */
function deductionShare(form: Accessor, info: Form8379FilingInfo, joint: number): Value {
  const fact = info.form8379?.fact;
  if (fact === undefined) return undefined;
  // As Form 1040 line 12e reads them (1040/adjustmentsAndDeductions.ts).
  if (info.useItemizedDeductions === true) return fact.shares.itemizedDeductions;
  if (info.increasedStandardDeduction !== false) {
    return info.increasedStandardDeduction === true
      ? unsupported(DISASTER_STANDARD_DEDUCTION)
      : undefined;
  }
  const injured = fact.injuredSpouse === "taxpayer" ? "you" : "spouse";
  const other = injured === "you" ? "spouse" : "you";
  return standardDeductionShares(joint, boxesChecked(form, injured), boxesChecked(form, other))
    .injured;
}

/*
 * Line 19, column (b): the injured spouse's W-2 box 2 and 1099-R box 4, the
 * injured spouse's excess social security tax (that spouse's part of Schedule 3
 * line 11, schedule-3/excessSocialSecurity.ts), the injured spouse's part of
 * Form 8959 line 24, and the stated withholding on other Forms 1099 and W-2G
 * (irs-8379-inst-2025::sec::line-19::b01). A gap in either spouse's line 11 is
 * a gap here: column (a) holds Schedule 3 line 11.
 */
function withholdingShare(form: Accessor, spouses: Spouses, otherWithholding: number): Value {
  for (const excess of [spouses.injured.excessSocialSecurity, spouses.other.excessSocialSecurity]) {
    if ("gap" in excess) return unsupported(excess.gap);
  }
  const ownExcess = spouses.injured.excessSocialSecurity;
  const line24 = amount(form, "form-8959.0.line.24_total_additional_medicare_tax_withholding");
  const own = additionalMedicareWithholding(
    spouses.injured.medicareTaxWithheld,
    spouses.injured.medicareWages,
  );
  return sum(
    roundDollars(spouses.injured.w2Withholding),
    roundDollars(spouses.injured.retirementWithholding),
    "amount" in ownExcess ? roundDollars(ownExcess.amount) : 0,
    line24 > 0 ? Math.min(line24, own) : 0,
    otherWithholding,
  );
}

/* Column (b) of a line; undefined while the fact or a placed W-2 is missing. */
export function injuredShare(
  form: Accessor,
  info: Form8379FilingInfo,
  line: PartThreeLine,
  joint: number,
): Value {
  const fact = info.form8379?.fact;
  const spouses = info.form8379?.spouses;
  if (fact === undefined) return undefined;
  const { shares } = fact;
  const stated: Partial<Record<PartThreeLine, number>> = {
    "13b": shares.otherIncome,
    "14": shares.adjustments,
    "16": shares.nonrefundableCredits,
    "17": shares.refundableCredits,
    "18": shares.otherTaxes,
  };
  if (line in stated) return stated[line];
  if (line === "15") return deductionShare(form, info, joint);
  if (line === "20")
    return fact.paymentsNotAgreed === true ? unsupported(PAYMENTS_NOT_AGREED) : shares.payments;
  if (spouses === undefined) return undefined;
  // Line 13a: "enter the separate income that each spouse earned" (irs-8379-inst-2025::sec::line-13a::b01).
  if (line === "13a") return roundDollars(spouses.injured.wages);
  return withholdingShare(form, spouses, shares.otherWithholding);
}

export interface Columns {
  a: number;
  b: number;
  c: number;
}

/*
 * The three columns of a line. All three are blank when the joint return has
 * no amount and the injured spouse none. Only line 13b, income, can hold a
 * negative amount or a share above column (a).
 */
export function columnsOf(
  form: Accessor,
  info: Form8379FilingInfo,
  line: PartThreeLine,
): Columns | Unsupported | undefined {
  const joint = jointAmount(form, line);
  if (typeof joint !== "number") return joint;
  const injured = injuredShare(form, info, line, joint);
  if (typeof injured !== "number") return injured;
  if (joint === 0 && injured === 0) return undefined;
  if (line !== "13b" && (injured < 0 || injured > joint)) return unsupported(SHARE_OVER_JOINT);
  return { a: joint, b: injured, c: otherSpouseShare(joint, injured) };
}
