import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Money } from "../../money.js";
import type { Form3903FilingInfo } from "../3903/filingInfo.js";
import type { Form4137FilingInfo } from "../4137/filingInfo.js";
import type { Form8615FilingInfo } from "../8615/filingInfo.js";
import type { Form8814FilingInfo } from "../8814/filingInfo.js";
import type { Form8863FilingInfo } from "../8863/filingInfo.js";
import type { Schedule8812FilingInfo } from "../schedule-8812/filingInfo.js";
import type { ScheduleAFilingInfo } from "../schedule-a/filingInfo.js";
import type { RentalProperty } from "../schedule-e/filingInfo.js";
import type { EicLineSlot } from "../schedule-eic/eicAnswers.js";
import type { ScheduleSEFilingInfo } from "../schedule-se/filingInfo.js";

/*
 * The Dependents table reads Schedule 8812's `dependents` slot. Line 27a reads
 * its combat pay (Step 5 line 4), Schedule SE's Schedule C net profit
 * (Worksheet B line 2b), Schedule E's columns (Pub. 596 Worksheet 1) and the
 * EIC answers and counts. Line 12e reads Schedule A's increased standard
 * deduction mode. Line 1c reads Form 4137's tip income.
 * Line 1h reads Form 3903's excess reimbursement.
 * Lines 3a–3c, 7a, 7b and 16 read Form 8814's totals. Line 16 reads Form 8615.
 * Line 29 reads Form 8863's figures to tell a gap from "no credit".
 */
export interface Form1040FilingInfo
  extends
    BaseFilingInfo,
    EicLineSlot,
    Pick<Form3903FilingInfo, "movingReimbursementExcess" | "movingTotalsGap">,
    Pick<Schedule8812FilingInfo, "dependents" | "w2NontaxableCombatPay">,
    Pick<ScheduleSEFilingInfo, "scheduleCNetProfit">,
    Pick<ScheduleAFilingInfo, "increasedStandardDeduction">,
    Pick<Form4137FilingInfo, "tipIncomeNotOnLine1a" | "employeeCashTips">,
    Pick<Form8814FilingInfo, "form8814Totals">,
    Omit<Form8615FilingInfo, keyof BaseFilingInfo | "useItemizedDeductions">,
    Pick<Form8863FilingInfo, "form8863"> {
  /** Social Security with a traditional IRA contribution and a plan: Pub. 590-A figures line 6b (schedule-1/pub590a.ts). */
  pub590aWorksheets?: boolean;

  /** Every filer must answer. Undefined fills neither box, so the gap shows. */
  hasDigitalAssets?: boolean;
  /** Schedule E's resolver fills it (Pub. 596 Worksheet 1). */
  rentalProperties?: RentalProperty[];
  w2WagesTotal?: Money;
  w2FederalWithholding?: Money;
  ordinaryDividends?: Money;
  qualifiedDividends?: Money;
  /** Line 25b. */
  form1099FederalWithholding?: Money;
  /** Line 25c: W-2G box 4 sum, not rounded. */
  w2gFederalWithholding?: Money;
  capitalGainDistributionsNoScheduleD?: Money;
  taxableInterestTotal?: Money;
  taxExemptInterestTotal?: Money;
  /** Lines 4a–4c. */
  iraDistributions?: IraLine;
  /** Line 1h: disability pensions before the minimum retirement age; undefined while an answer is missing. */
  disabilityPensionWages?: number;
  /** Line 1h: corrective distributions (1099-R code 8 from an employer plan). */
  correctiveDistributionWages?: number;
  /** Line 1h waits: a disability pension's answer, or a taxable amount, is missing. */
  line1hWaits?: boolean;
  /** Line 1h: why it cannot be figured (a corrective distribution, excess deferrals); undefined when it can. */
  line1hGap?: string;
  /** Lines 5a–5c. */
  pensionDistributions?: RetirementLine;
  /** Line 6a. */
  socialSecurityBenefits?: Money;
  /** MFS: the line 6d box, and a $25,000 worksheet base instead of 0. */
  livedApartFromSpouseAllYear?: boolean;
  /** MFS or HOH: the page 1 box (lived apart the last 6 months of the year). */
  livedApartFromSpouseLastSixMonths?: boolean;
  /** MFS or HOH: the page 1 box (legally separated, not in the spouse's household at year end). */
  legallySeparatedApartAtYearEnd?: boolean;
  /** MFS: the line 12b box. */
  spouseItemizesSeparately?: boolean;
  /** Federal only. Form 540 has its own: a taxpayer can choose per jurisdiction. */
  refundFullOverpaymentFederal?: boolean;
  useItemizedDeductions?: boolean;
}

/** `taxable` is undefined when a 1099-R needs the Simplified Method or Form 8606 (not modeled). */
export interface RetirementLine {
  gross: number;
  taxable?: number;
  rollover: boolean;
}

/**
 * `taxable` leaves out a Form 8606 Part I filer's traditional IRA rows (line 4b
 * adds line 15c) and every filer's Roth conversions (line 4b adds line 18).
 */
export interface IraLine extends RetirementLine {
  /** People who file Form 8606 (0, 1 or 2). */
  form8606Filers: number;
  /** The one filer's traditional distributions or conversion go through Form 8606 Part I (line 15c). */
  form8606PartI: boolean;
  /** Why Form 8606 line 1, and so line 15c, is not figured (8606 resolveInfo worksheetLine1). */
  form8606Line1Gap?: string;
}
