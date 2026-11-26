/* Form 1040 Income: lines 1a to 9. */

import type { FormAccessor } from "../../defineForm.js";
import { atLeast, numberOrBlank, roundDollars, sum, sumOrBlank } from "../../money.js";
import { unsupported } from "../../types.js";
import { socialSecurityTaxable } from "../../worksheets/socialSecurityBenefits.js";
import { line1fFrom8839, socialSecurityGapFrom8839 } from "../8839/receivers.js";
import { line4bWithForm8915F, line5bWithForm8915F } from "../8915-f/receivers.js";
import { withLaterForm8919Copies } from "../8919/laterCopies.js";
import { roundedWithReceived } from "../passThrough/receipts.js";
import { PUB_590A_GAP } from "../schedule-1/pub590a.js";
import { form1040Line7a } from "../schedule-d/lines.js";
import type { Form1040FilingInfo } from "./filingInfo.js";
import { line3a, line7aWithoutScheduleD } from "./form8814Lines.js";
import type { Form1040 } from "./types.js";
import { WITHOUT_8839 } from "./withoutForm8839.js";

type Form = FormAccessor<Form1040>;

/*
 * MANUAL EDIT: document sums (1a, 2a–3b, 25a) round to the nearest dollar. Line
 * 1a adds Form 2106's excess reimbursement: "if line 7 is greater than line 6 in
 * Column A, report the excess as income on Form 1040 ... line 1a" (Form 2106
 * line 8; irs-2106-inst-2025::sec::general-instructions::b01).
 */
export function line1a(_: unknown, info: Form1040FilingInfo) {
  const excess = info.form2106Totals?.excessReimbursement;
  if (!excess) {
    if (info.form2106TotalsGap) return unsupported(info.form2106TotalsGap);
    return roundDollars(info.w2WagesTotal);
  }
  return roundDollars(sum(info.w2WagesTotal, excess));
}

/*
 * MANUAL EDIT: irs-1040-inst-2025::sec::line-1c::b01: tips not reported to the
 * employer, with W-2 box 8 allocated tips, and noncash tips (4137/lines.ts).
 * With one Form 4137 it equals that form's line 4 plus noncash tips.
 */
export const line1c = (_: unknown, info: Form1040FilingInfo) => info.tipIncomeNotOnLine1a;

/*
 * MANUAL EDIT: "Enter the total of your wages from Form 8919, line 6"
 * (irs-1040-inst-2025::sec::line-1g::b01): each spouse's form on a joint
 * return. Blank when no Form 8919 files.
 */
export const line1g = (form: Form, info: Form1040FilingInfo) =>
  withLaterForm8919Copies(form["form-8919.0.line.6_total_wages"], info, (lines) => lines.line6);

/*
 * MANUAL EDIT: "If line 26 is more than zero, you have taxable dependent
 * care benefits. Enter this amount on Form 1040 ... line 1e"
 * (irs-2441-inst-2025::sec::line-26::b01).
 */
export function line1e(form: Form) {
  const line26 = numberOrBlank(form["form-2441.1.line.26_taxable_benefits"]);
  return line26 !== undefined && line26 > 0 ? line26 : undefined;
}

// MANUAL EDIT: Form 8839 line 31 (irs-1040-inst-2025::sec::line-1f::b01); negative on its Yes box.
export function line1f(form: Form, info: Form1040FilingInfo) {
  const received = line1fFrom8839(form, info);
  return received === undefined ? unsupported(WITHOUT_8839.line1f) : received.value;
}

/*
 * MANUAL EDIT: line 1h holds the taxable amount of the disability pensions
 * received before the minimum retirement age (irs-1040-inst-2025::sec::line-1h::b02)
 * and of corrective distributions (code 8, ::line-1h::b03). Code P or B and
 * excess deferrals make it unsupported (line1hGaps.ts). Strike benefits have
 * no fact, and a retired public safety officer's premium exclusion ("PSO",
 * irs-1040-inst-2025::sec::insurance-premiums-for-retired::b03) has no answer.
 * It also holds Form 3903 line 4 − line 3 when more than 0 (irs-3903-inst-2025::sec::line-5::b01).
 */
export function line1hAmount(_: unknown, info: Form1040FilingInfo) {
  if (info.line1hGap) return unsupported(info.line1hGap);
  if (info.movingTotalsGap) return unsupported(info.movingTotalsGap);
  if (info.line1hWaits) return undefined;
  return roundDollars(
    sumOrBlank(
      info.disabilityPensionWages,
      info.correctiveDistributionWages,
      info.movingReimbursementExcess,
    ),
  );
}

export const line1z = (form: Form) =>
  sum(
    form["line.1a"],
    form["line.1b"],
    form["line.1c"],
    form["line.1d"],
    form["line.1e"],
    form["line.1f"],
    form["line.1g"],
    form["line.1h_amount"],
  );

// MANUAL EDIT: 1099-INT box 8 sum, and a K-1's tax-exempt interest (box 16 code A).
export const line2a = (_: unknown, info: Form1040FilingInfo) =>
  roundedWithReceived(info.taxExemptInterestTotal, info.passThroughTaxExemptInterest);

/*
 * MANUAL EDIT: with Schedule B filed, lines 2b and 3b copy its lines 4
 * and 6, so its rounding choice carries through. Without it, line 2b adds a
 * K-1's interest (irs-1041k1-inst-2025::sec::box-1-interest-income::b01).
 */
export const line2b = (form: Form, info: Form1040FilingInfo) =>
  numberOrBlank(form["schedule-b.0.line.4_taxable_interest"]) ??
  roundedWithReceived(info.taxableInterestTotal, info.passThroughInterest);

// MANUAL EDIT: lines 3a–3c, 7a, 7b and 16 take Form 8814 amounts (form8814Lines.ts).
export const line3aQualifiedDividends = (_: unknown, info: Form1040FilingInfo) => line3a(info);

// MANUAL EDIT: lines 4a–5c from 1099-R facts.
export const line4a = (_: unknown, info: Form1040FilingInfo) =>
  roundDollars(info.iraDistributions?.gross);

/*
 * MANUAL EDIT: line 4b adds the Form 8606 filer's line 18, and line 15c when
 * Part I applies (Part III, line 25c, is not modeled). With a Form 8915-F,
 * its line 26 and the IRA part of line 32 replace the 1099-R amounts it
 * reports (federal/8915-f/receivers.ts).
 */
export function line4b(form: Form, info: Form1040FilingInfo) {
  const rows = line4bFromRows(form, info);
  const disaster = info.form8915FReturn;
  if (!disaster) return rows;
  return line4bWithForm8915F(rows, info.iraDistributions !== undefined, form, disaster);
}

function line4bFromRows(form: Form, info: Form1040FilingInfo) {
  const ira = info.iraDistributions;
  if (ira?.taxable === undefined) return undefined;
  if (ira.form8606Filers === 0) return roundDollars(ira.taxable);
  // Only the first Form 8606 copy is evaluated, so two filers leave line 4b blank.
  if (ira.form8606Filers > 1) return undefined;
  if (ira.form8606PartI && ira.form8606Line1Gap) return unsupported(ira.form8606Line1Gap);
  const line15c = form["form-8606.1.line.15c_taxable_traditional_distributions"];
  const line16 = form["form-8606.1.line.16_net_amount_converted"];
  const line18 = form["form-8606.1.line.18_taxable_conversion_amount"];
  if (ira.form8606PartI && typeof line15c !== "number") return undefined;
  if (typeof line16 === "number" && typeof line18 !== "number") return undefined;
  // 8606 inst. line 18: zero or less is not included on line 4b.
  const fromPartI = ira.form8606PartI ? line15c : 0;
  return roundDollars(sum(ira.taxable, fromPartI, atLeast(0, line18 ?? 0)));
}

export const line4cRollover = (_: unknown, info: Form1040FilingInfo) =>
  info.iraDistributions?.rollover ? true : undefined;

// MANUAL EDIT: a Form 4972 takes its distribution off lines 5a and 5b (federal/4972/line5.ts).
export const line5a = (_: unknown, info: Form1040FilingInfo) =>
  info.pensionDistributionsGap
    ? unsupported(info.pensionDistributionsGap)
    : roundDollars(info.pensionDistributions?.gross);

// MANUAL EDIT: with a Form 8915-F, its line 15 and the plan part of line 32 (federal/8915-f/receivers.ts).
export function line5b(_: unknown, info: Form1040FilingInfo) {
  if (info.pensionDistributionsGap) return unsupported(info.pensionDistributionsGap);
  const rows = roundDollars(info.pensionDistributions?.taxable);
  const disaster = info.form8915FReturn;
  if (!disaster) return rows;
  const waits = info.pensionDistributions !== undefined || info.line1hWaits === true;
  return line5bWithForm8915F(rows, waits, disaster);
}

export const line5cRollover = (_: unknown, info: Form1040FilingInfo) =>
  info.pensionDistributions?.rollover ? true : undefined;

// MANUAL EDIT: for MFS, line 6b waits for the lived-apart answer; it picks the worksheet base.
export const line6a = (_: unknown, info: Form1040FilingInfo) =>
  roundDollars(info.socialSecurityBenefits);

export function line6b(form: Form, info: Form1040FilingInfo) {
  // MANUAL EDIT: Pub. 590-A's worksheets figure 6b with an IRA contribution (schedule-1/pub590a.ts).
  if (info.socialSecurityBenefits !== undefined && info.pub590aWorksheets)
    return unsupported(PUB_590A_GAP);
  // MANUAL EDIT: an adoption benefit exclusion takes the Pub. 915 worksheet (use-the-social-security-benefits::b01).
  const adoptionGap = socialSecurityGapFrom8839(info);
  if (adoptionGap) return adoptionGap;
  const benefits = info.socialSecurityBenefits;
  if (benefits === undefined || !info.filingStatus) return undefined;
  const mfs = info.filingStatus === "married_filing_separately";
  if (mfs && info.livedApartFromSpouseAllYear === undefined) return undefined;
  return socialSecurityTaxable({
    benefits,
    otherIncome: sum(
      form["line.1z"],
      /*
       * MANUAL EDIT: with Form 8815, Pub. 915 Worksheet 1 line 3 takes Schedule B
       * line 2, not line 2b (irs-pub-915-2025::sec::repayments-more-than-gross::b04).
       */
      info.mustFile?.["form-8815"]?.value === true
        ? form["schedule-b.0.line.2_total_interest"]
        : form["line.2b"],
      form["line.3b"],
      form["line.4b"],
      form["line.5b"],
      form["line.7a"],
      form["line.8"],
    ),
    taxExemptInterest: sum(form["line.2a"]),
    adjustments: sum(
      form["schedule-1.1.line.11"],
      form["schedule-1.1.line.12"],
      form["schedule-1.1.line.13"],
      form["schedule-1.1.line.14"],
      form["schedule-1.1.line.15"],
      form["schedule-1.1.line.16"],
      form["schedule-1.1.line.17"],
      form["schedule-1.1.line.18"],
      form["schedule-1.1.line.19a"],
      form["schedule-1.1.line.20"],
      form["schedule-1.1.line.23"],
      form["schedule-1.1.line.25"],
    ),
    filingStatus: info.filingStatus,
    livedApartAllYear: info.livedApartFromSpouseAllYear,
  }).taxable;
}

export const line6dMfsLivedApart = (_: unknown, info: Form1040FilingInfo) =>
  info.socialSecurityBenefits !== undefined &&
  info.filingStatus === "married_filing_separately" &&
  info.livedApartFromSpouseAllYear === true
    ? true
    : undefined;

// MANUAL EDIT: line 7a = Schedule D line 16, or line 21 if line 16 is a loss.
export function line7a(form: Form, info: Form1040FilingInfo) {
  const value = form["schedule-d.1.line.16_combined_gain_loss"];
  if (typeof value === "number") {
    const l21 = form["schedule-d.1.line.21_allowable_loss"];
    return form1040Line7a(value, typeof l21 === "number" ? l21 : undefined);
  }
  // MANUAL EDIT: Exception 1 — capital gain distributions only, no Schedule D.
  return line7aWithoutScheduleD(info);
}

// MANUAL EDIT: line 8 = Schedule 1 line 10; blank when Schedule 1 is not filed.
export function line8(form: Form) {
  const value = form["schedule-1.0.line.10"];
  return typeof value === "number" ? value : undefined;
}

/*
 * MANUAL EDIT: irs-1040-inst-2025::sec::instructions-for-schedule-1::b01. Line 8
 * is Schedule 1 line 10. While Schedule 1 is filed and line 10 is blank, line 9
 * waits: sum() would add 0 and give a total that looks complete.
 */
export const line9 = (form: Form, info: Form1040FilingInfo) =>
  info.mustFile?.["schedule-1"]?.value === true && form["line.8"] === undefined
    ? undefined
    : sum(
        form["line.1z"],
        form["line.2b"],
        form["line.3b"],
        form["line.4b"],
        form["line.5b"],
        form["line.6b"],
        form["line.7a"],
        form["line.8"],
      );
