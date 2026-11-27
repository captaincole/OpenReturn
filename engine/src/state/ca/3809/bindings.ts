/*
 * FTB 3809, Targeted Tax Area Deduction and Credit Summary, for a Form 540
 * individual. The TTA expired at the end of 2012: the form carries last
 * year's credit and NOL carryovers forward and takes what this year's TTA
 * business income allows. Worksheet I gives that income, Worksheet II the NOL
 * deduction (Part III, and Schedule CA (540) line 9b3), Schedule Z the credit
 * limit (figures.ts, lines.ts); Schedule P (540) or the tax left decides the
 * credit used (creditUsed.ts). Schedule Z Parts III and IV are for S
 * corporations and corporations, so they stay blank.
 */

import { defineForm, type BindingFn, type FormAccessor } from "../../../defineForm.js";
import { isGap } from "../../../federal/3800/cells.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import type { Unsupported } from "../../../types.js";
import { ratioText } from "../schedule-s/lines.js";
import { ttaCreditGap, ttaCreditUsed } from "./creditUsed.js";
import {
  creditCarryovers,
  nolWorksheet,
  returnGap,
  scheduleZ,
  sectionAPercentage,
  type Info,
} from "./figures.js";
import {
  line1c,
  scheduleZPartII,
  type ScheduleZPartI,
  type ScheduleZPartII,
  type WorksheetII,
} from "./lines.js";
import type { Form3809 } from "./types.js";

type Form = FormAccessor<Form3809>;
type Bindings = Partial<{ [K in keyof Form3809]: BindingFn<Form3809, Info, K> }>;

const isOperator = (info: Info) => info.tta?.business?.role === "operator";
const business = (info: Info) => info.tta?.business;

/*
 * The header. An individual files with an SSN or ITIN; the Secretary of State
 * file number is for an LLC or a corporation, so it is blank. Item A is the
 * taxpayer's entity type: a Form 540 filer is an individual. Items B to D are
 * for every filer; items E to H only for one who operates the business ("Investors
 * of pass-through entities, complete items A through D",
 * ca-3809-booklet-2025::sec::form-ftb-3809-instructions-for-items-a-through-h::b01).
 */
const header: Bindings = {
  "0.header.id_number_type": () => "ssn_or_itin",
  "0.header.id_number": (_, info) => info.taxpayerSSN,
  "0.header.name_shown_on_return": (_, info) => namesOnReturn(info),
  "0.header.sos_file_number": () => undefined,
  "0.header.sic_code": (_, info) => business(info)?.sicCode,
  "0.header.a_entity_type": () => "individual",
  "0.header.b_tta_business_name": (_, info) => business(info)?.businessName,
  "0.header.c_tta_business_address": (_, info) => business(info)?.businessAddress,
  "0.header.d_tta_specific_area_name": (_, info) => business(info)?.areaName,
  "0.header.e_principal_business_activity_code": (_, info) =>
    isOperator(info) ? business(info)?.principalBusinessActivityCode : undefined,
  "0.header.f_total_employees_in_tta": (_, info) =>
    isOperator(info) ? business(info)?.employeesInTta : undefined,
  "0.header.g_gross_annual_receipts": (_, info) =>
    isOperator(info) ? business(info)?.grossAnnualReceipts : undefined,
  "0.header.h_total_asset_value": (_, info) =>
    isOperator(info) ? business(info)?.totalAssetValue : undefined,
};

/* Schedule Z Part I as figured, its gap, or undefined (no credit carryover, or it waits). */
const partI =
  <T>(pick: (lines: ScheduleZPartI) => T) =>
  (form: Form, info: Info): T | Unsupported | undefined => {
    const lines = scheduleZ(form, info);
    if (lines === undefined || isGap(lines)) return lines;
    return pick(lines);
  };

/* Schedule Z Part II from Part I line 7 and the credit used, its gap, or undefined. */
function partIILines(form: Form, info: Info): ScheduleZPartII | Unsupported | undefined {
  const lines = scheduleZ(form, info);
  if (lines === undefined || isGap(lines)) return lines;
  const gap = ttaCreditGap(info);
  if (gap !== undefined) return gap;
  const used = ttaCreditUsed((fieldId) => form[fieldId], info);
  const carryovers = creditCarryovers(info);
  if (used === undefined || isGap(used)) return used;
  if (carryovers === undefined) return undefined;
  return scheduleZPartII(lines.line7, carryovers.hiring, carryovers.sales, used);
}

const partII =
  <T>(pick: (lines: ScheduleZPartII) => T) =>
  (form: Form, info: Info): T | Unsupported | undefined => {
    const lines = partIILines(form, info);
    if (lines === undefined || isGap(lines)) return lines;
    return pick(lines);
  };

const scheduleZBindings: Bindings = {
  "1.line.1_trade_or_business_income": partI((lines) => lines.line1),
  // "Individuals: ... (skip line 2)" (the form, line 1).
  "1.line.2_average_apportionment_percentage": () => undefined,
  "1.line.3_apportioned_business_income": partI((lines) => lines.line3),
  "1.line.4_tta_nol_deduction": partI((lines) => lines.line4),
  "1.line.5_tta_taxable_income": partI((lines) => lines.line5),
  "1.line.6a_tax_on_tta_income": partI((lines) => lines.line6a),
  "1.line.6b_tax_from_return": partI((lines) => lines.line6b),
  "1.line.7_tta_business_income_limitation": partI((lines) => lines.line7),
  "1.line.8a_hiring_credit_carryover_col_e": partII((lines) => lines.line8aColE),
  "1.line.8a_hiring_credit_carryover_col_f": partII((lines) => lines.line8aColF),
  "1.line.8b_hiring_credit_carryover_col_b": partII((lines) => lines.line8bColB),
  // "Individuals, estates, and trusts, leave blank" (::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b02).
  "1.line.8b_hiring_credit_carryover_col_c": () => undefined,
  "1.line.8b_hiring_credit_carryover_col_d": partII((lines) => lines.line8bColD),
  "1.line.8b_hiring_credit_carryover_col_e": partII((lines) => lines.line8bColE),
  "1.line.8b_hiring_credit_carryover_col_g": partII((lines) => lines.line8bColG),
  "1.line.9a_sales_use_tax_credit_carryover_col_e": partII((lines) => lines.line9aColE),
  "1.line.9a_sales_use_tax_credit_carryover_col_f": partII((lines) => lines.line9aColF),
  "1.line.9b_sales_use_tax_credit_carryover_col_b": partII((lines) => lines.line9bColB),
  // The same rule for line 9B (::b04).
  "1.line.9b_sales_use_tax_credit_carryover_col_c": () => undefined,
  "1.line.9b_sales_use_tax_credit_carryover_col_d": partII((lines) => lines.line9bColD),
  "1.line.9b_sales_use_tax_credit_carryover_col_e": partII((lines) => lines.line9bColE),
  "1.line.9b_sales_use_tax_credit_carryover_col_g": partII((lines) => lines.line9bColG),
};

/*
 * Parts III and IV: "Use Part III of Schedule Z only if you are an S
 * corporation" (ca-3809-booklet-2025::sec::part-iii-limitation-of-credits-for-s-corporations-only::b01)
 * and Part IV "if the corporation or S corporation is subject to paying only
 * the minimum franchise tax"
 * (::part-iv-limitation-of-credits-for-corporations-and-s-corporations-subject-to-paying-only-the-minimum-franchise-tax::b01).
 * A Form 540 filer is neither, so every line is blank.
 */
const ENTITY_ONLY_LINES = [
  "1.line.10_hiring_credit_carryover_col_b",
  "1.line.10_hiring_credit_carryover_col_c",
  "1.line.10_hiring_credit_carryover_col_d",
  "1.line.11_sales_use_tax_credit_carryover_col_b",
  "1.line.11_sales_use_tax_credit_carryover_col_c",
  "1.line.11_sales_use_tax_credit_carryover_col_d",
  "1.line.12_hiring_credit_carryover_col_b",
  "1.line.12_hiring_credit_carryover_col_c",
  "1.line.12_hiring_credit_carryover_col_d",
  "1.line.13_sales_use_tax_credit_carryover_col_b",
  "1.line.13_sales_use_tax_credit_carryover_col_c",
  "1.line.13_sales_use_tax_credit_carryover_col_d",
] as const;

const entityOnlyBindings: Bindings = Object.fromEntries(
  ENTITY_ONLY_LINES.map((id) => [id, () => undefined]),
);

/* Worksheet II totals, its gap, or undefined (no TTA NOL carryover, or it waits). */
const partIIINol =
  (pick: (worksheet: WorksheetII) => number) =>
  (form: Form, info: Info): number | Unsupported | undefined => {
    const worksheet = nolWorksheet(form, info);
    if (worksheet === undefined || isGap(worksheet)) return worksheet;
    return pick(worksheet);
  };

const side1: Bindings = {
  /*
   * Line 1a: "Enter this amount on form FTB 3809, Side 1, line 1a" (line 8A
   * column (f)); line 1b, line 9A column (f)
   * (ca-3809-booklet-2025::sec::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b01, ::b03).
   */
  "0.line.1a_hiring_credit_carryover": partII((lines) => lines.line8aColF),
  "0.line.1b_sales_use_tax_credit_carryover": partII((lines) => lines.line9aColF),
  "0.line.1c_total_credit_carryover": partII((lines) => line1c(lines.line8aColF, lines.line9aColF)),
  /*
   * Line 1d: the credit "disallowed due to the $5,000,000 credit limitation"
   * and elected refundable on FTB 3870 (::line-1d-credit-amount-to-be-elected-as-refundable-in-future-years::b01).
   * The limit can bind only above $5,000,000 of net tax, which is a gap of
   * the credit lines (creditUsed.ts); below it nothing is disallowed, so the
   * line is blank.
   */
  "0.line.1d_credit_elected_refundable": (form, info) => {
    const lines = partIILines(form, info);
    return isGap(lines) ? lines : undefined;
  },
  /*
   * Line 2: Worksheet I, Section A, line 4, printed as a decimal ("1.0000"
   * when the operation is wholly within the former TTA). Section A is the
   * operator's worksheet ("Sole proprietors: Complete Schedule Z and all the
   * worksheets"; an individual investor completes Section B,
   * ::how-to-claim-deductions-and-credit-carryovers::b01), so an investor's
   * line is blank.
   */
  "0.line.2_average_apportionment_percentage": (_, info) => {
    const gap = returnGap(info);
    if (gap !== undefined) return gap;
    if (!isOperator(info)) return undefined;
    const percentage = sectionAPercentage(info);
    return percentage === undefined ? undefined : ratioText(percentage);
  },
  // Lines 3a and 3c: Worksheet II line 9, columns (b) and (e); line 3b, column (c) (::example-2::b02).
  "0.line.3a_nol_carryover_prior_years": partIIINol((worksheet) => worksheet.totalCarryover),
  "0.line.3b_nol_deduction_current_year": partIIINol((worksheet) => worksheet.totalDeducted),
  "0.line.3c_nol_carryover_future_years": partIIINol((worksheet) => worksheet.totalCarriedForward),
};

export function register(): void {
  defineForm<Form3809, Info>("form-3809", {
    bindings: { ...header, ...side1, ...scheduleZBindings, ...entityOnlyBindings },
  });
}
