/*
 * FTB 3805V's reads of the return, by full field id, so Schedule CA (540)
 * lines 9b1 and 9b2 figure the same deductions with their own accessor. Each
 * read is an amount, the reason the engine cannot figure it, or undefined
 * while a line waits.
 */

import { sum } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { isUnsupportedResult } from "../3801/context.js";
import type { ScheduleCaFilingInfo } from "../schedule-ca/filingInfo.js";
import { partIIUnsupported } from "../schedule-ca/increasedStandard.js";
import { LINE_29_FEDERAL_AGI_THRESHOLD } from "../schedule-ca/itemizedWorksheet.js";
import { LINE_10_SUBTRACTIONS_BEFORE_NOL } from "../schedule-ca/line10.js";
import type { ScheduleDCaFilingInfo } from "../schedule-d-ca/filingInfo.js";
import type { Form3805VFigures, Form3805VFilingInfo } from "./filingInfo.js";
import { modifiedTaxableIncome, nolSuspended, SUSPENSION_THRESHOLD, type Amount } from "./lines.js";
import { carryoverRowGap, priorYearLines, type PriorYearLines } from "./partIII.js";

export type Info = Form3805VFilingInfo &
  Pick<ScheduleCaFilingInfo, "increasedStandardDeduction" | "disasterLossGap"> &
  Pick<ScheduleDCaFilingInfo, "californiaSection1231Gain">;
export type Read = Record<string, unknown>;

const SCHEDULE_CA = "schedule-ca.";
/* Form 540 line 13 is federal AGI, Form 1040 line 11b (state/ca/540/taxableIncome.ts). */
const FEDERAL_AGI = "form-1040.line.11b";
export const CA_AGI = "form-540.line.17_ca_agi";
const DEDUCTION = "form-540.line.18_deductions";

/*
 * Part II line 5 refigures itemized deductions that depend on AGI
 * (ca-3805v-inst-2025::sec::part-ii-modified-taxable-income-mti::b02, federal
 * Form 172). A contribution limit can bind only above the lowest one, 20% of
 * AGI (irs-pub-526-2025::sec::limit-based-on-20-of-agi::b01).
 */
const LOWEST_GIFT_LIMIT_RATE = 0.2;

export const ITEMIZED_REFIGURE_GAP =
  "Part II line 5: the itemized deductions depend on AGI (medical expenses, the 2% floor, the itemized deduction limitation or a contribution limit) and the capital loss deduction changes AGI; refiguring them as federal Form 172 does is not modeled.";
const NET_BUSINESS_INCOME_GAP =
  "The NOL suspension test reads net business income from Schedule E lines 26, 32 and 40 in California amounts (ca-3805v-inst-2025::sec::part-iii-limitations::b02); Schedule CA line 5 has a California adjustment the engine cannot split among those lines.";

/* Column A less column B plus column C of a Schedule CA (540) line; a column the line lacks counts 0. */
export function caAmount(form: Read, line: string): number {
  const column = (suffix: string) => form[`${SCHEDULE_CA}${line}_${suffix}`];
  return sum(column("federal")) - sum(column("subtractions")) + sum(column("additions"));
}

/*
 * California AGI before Schedule CA lines 9b1 and 9b2: federal AGI less line
 * 27 column B without those lines, plus line 27 column C (Form 540 lines 13 to
 * 17 are federal AGI less column B plus column C). Undefined while federal AGI waits.
 */
function agiBeforeCarryovers(form: Read): number | undefined {
  const federalAgi = form[FEDERAL_AGI];
  if (typeof federalAgi !== "number") return undefined;
  const line10 = sum(...LINE_10_SUBTRACTIONS_BEFORE_NOL.map((id) => form[`${SCHEDULE_CA}${id}`]));
  const columnB = line10 - sum(form[`${SCHEDULE_CA}3.line.c26_subtractions`]);
  return federalAgi - columnB + sum(form[`${SCHEDULE_CA}3.line.c27_additions`]);
}

/* Form 540 line 18; its gap with the federal increased standard deduction, else undefined while it waits. */
export function deductionOf(form: Read, info: Info): Amount | undefined {
  const line18 = form[DEDUCTION];
  return typeof line18 === "number" ? line18 : partIIUnsupported(info);
}

/* The capital loss deduction: Schedule CA line 7a in California amounts, when a loss (Schedule D (540) line 11). */
export function capitalLossDeductionOf(form: Read): number {
  const line7a = caAmount(form, "0.line.7a");
  return line7a < 0 ? -line7a : 0;
}

/* Form 540 line 18 is Schedule CA line 29: the return itemizes. */
export function itemizes(form: Read, deduction: number): boolean {
  const line29 = form[`${SCHEDULE_CA}5.page2.total_itemized_29`];
  return typeof line29 === "number" && line29 === deduction;
}

/*
 * Part II line 5: "the adjustments to itemized deductions, used to figure your
 * federal NOL carryover" (::part-ii-modified-taxable-income-mti::b02). California
 * itemized deductions follow federal AGI, which the California carryovers do not
 * change; only the capital loss deduction (line 2) does. 0 with no itemized
 * deductions or no capital loss deduction, or when no itemized deduction depends
 * on AGI; else the gap (QUESTIONS.md).
 */
export function itemizedAdjustment(
  form: Read,
  info: Info,
  deduction: number,
  capitalLossDeduction: number,
): Amount {
  if (capitalLossDeduction === 0 || !itemizes(form, deduction)) return 0;
  const federalAgi = sum(form[FEDERAL_AGI]);
  const status = info.filingStatus;
  const dependsOnAgi = [
    sum(form["schedule-a.0.line.4_net_medical_dental"]) > 0,
    sum(form[`${SCHEDULE_CA}5.page2.job_expenses_22_total`]) > 0,
    status !== undefined &&
      federalAgi + capitalLossDeduction > LINE_29_FEDERAL_AGI_THRESHOLD[status],
    sum(form["schedule-a.0.line.14_total_gifts"]) > federalAgi * LOWEST_GIFT_LIMIT_RATE,
  ];
  return dependsOnAgi.includes(true) ? unsupported(ITEMIZED_REFIGURE_GAP) : 0;
}

/* Part II line 6, figured before the carryover deductions (lines.ts). */
export function mtiOf(form: Read, info: Info): Amount | undefined {
  const agi = agiBeforeCarryovers(form);
  const deduction = deductionOf(form, info);
  if (deduction === undefined || isUnsupportedResult(deduction)) return deduction;
  if (agi === undefined) return undefined;
  const capitalLossDeduction = capitalLossDeductionOf(form);
  const adjustment = itemizedAdjustment(form, info, deduction, capitalLossDeduction);
  if (isUnsupportedResult(adjustment)) return adjustment;
  return modifiedTaxableIncome({
    agiBeforeCarryovers: agi,
    deduction,
    capitalLossDeduction,
    itemizedAdjustment: adjustment,
  });
}

/*
 * The suspension test (::part-iii-limitations::b02): net business income is
 * Schedule CA Section B lines 3, 4 and 6 in California amounts, Schedule E
 * lines 26, 32 and 40, and Form 4797 line 9 in California amounts (Schedule
 * D-1); modified AGI is Form 540 line 13 without a federal NOL deduction, which
 * the engine does not model. Below $1,000,000 of modified AGI nothing else is read.
 */
export function suspendedOf(form: Read, info: Info): boolean | Unsupported | undefined {
  const modifiedAgi = form[FEDERAL_AGI];
  if (typeof modifiedAgi !== "number") return undefined;
  if (modifiedAgi < SUSPENSION_THRESHOLD) return false;
  if (sum(form[`${SCHEDULE_CA}0.line.b5_subtractions`], form[`${SCHEDULE_CA}0.line.b5_additions`]))
    return unsupported(NET_BUSINESS_INCOME_GAP);
  const section1231 = info.californiaSection1231Gain;
  if (section1231?.gap) return unsupported(`Schedule D-1: ${section1231.gap}`);
  const netBusinessIncome =
    caAmount(form, "0.line.b3") +
    caAmount(form, "0.line.b4") +
    caAmount(form, "0.line.b6") +
    sum(
      form["schedule-e.0.line.26_total_income_or_loss"],
      form["schedule-e.1.line.32_total_partnership_s_corp_income"],
      form["schedule-e.1.line.40_net_farm_rental_income"],
      section1231?.gain,
    );
  return nolSuspended(netBusinessIncome, modifiedAgi);
}

const NO_CARRYOVERS: PriorYearLines = { line1: 0, rows: [], disasterUsed: 0, nolUsed: 0 };

/* The form's figures, or its gap (Form 540NR); undefined when it does not file. */
export function figuresOf(info: Info): Form3805VFigures | Unsupported | undefined {
  const figures = info.form3805v;
  if (figures?.gap) return unsupported(figures.gap);
  return figures;
}

/*
 * DECISION (2026-11-25, by the author): with the deduction suspended, a
 * disaster loss row is still deducted, and the other rows are not.
 * Text A, the suspension rule: "taxpayers with net business income or modified
 * AGI of less than $1,000,000 or with disaster loss carryovers are not affected
 * by the NOL suspension rules" (ca-3805v-inst-2025::sec::part-iii-limitations::b02).
 * Text B, the disaster rule: "Any law that suspends, defers, reduces, or
 * otherwise diminishes the deduction of an NOL shall not apply to an NOL
 * attributable to these specified disaster losses" (::declared-disasters::b14).
 * Text A read alone would free every NOL of a taxpayer who has any disaster
 * carryover; the engine follows Text B, the rule that names the loss it frees.
 *
 * Part III, prior year rows: columns (f) to (h) from the MTI and the suspension.
 * Their column (f) totals are Schedule CA (540) lines 9b1 and 9b2.
 */
export function carryoverDeductions(
  form: Read,
  info: Info,
): PriorYearLines | Unsupported | undefined {
  const figures = figuresOf(info);
  if (figures === undefined || isUnsupportedResult(figures)) return figures;
  if (figures.priorRows.length === 0) return NO_CARRYOVERS;
  const rowGap = figures.priorRows.map(carryoverRowGap).find((gap) => gap !== undefined);
  if (rowGap) return unsupported(rowGap);
  const mti = mtiOf(form, info);
  if (mti === undefined || isUnsupportedResult(mti)) return mti;
  const suspended = suspendedOf(form, info);
  if (suspended === undefined || isUnsupportedResult(suspended)) return suspended;
  return priorYearLines(figures.priorRows, mti, suspended);
}
