/*
 * FTB 3805Z, Enterprise Zone Deduction and Credit Summary, for an individual
 * on Form 540. Side 1 items B to H describe the business in the former zone;
 * Part III takes the EZ NOL deduction from Worksheet II; Schedule Z Part I
 * limits the credit carryovers to the tax on EZ business income, and Part II
 * splits the credit Schedule P (540) or the tax left lets the return use
 * between the hiring and the sales or use tax credit (figures.ts,
 * creditUsed.ts, lines.ts). Schedule Z Parts III and IV are for S
 * corporations and corporations only, so they are blank.
 */

import { defineForm, type BindingFn, type FormAccessor } from "../../../defineForm.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import type { Unsupported } from "../../../types.js";
import type { Form3541FilingInfo } from "../3541/filingInfo.js";
import { isUnsupportedResult } from "../3801/context.js";
import { enterpriseZoneCreditUsed } from "./creditUsed.js";
import {
  enterpriseZoneReturnGap,
  nolFiguresOf,
  partIOf,
  sectionAPercentage,
  type Info as FiguresInfo,
  type PartIFigures,
} from "./figures.js";
import type { EnterpriseZoneBusiness, Form3805ZFilingInfo } from "./filingInfo.js";
import { partII, percentageText, type NolWorksheet, type PartII } from "./lines.js";
import type { Form3805Z } from "./types.js";

type Info = FiguresInfo & Form3541FilingInfo;
type Form = FormAccessor<Form3805Z>;
type Bindings = Partial<{ [K in keyof Form3805Z]: BindingFn<Form3805Z, Info, K> }>;
type Result<T> = T | Unsupported | undefined;

const isGap = (value: unknown): value is Unsupported => isUnsupportedResult(value);

const businessOf = (info: Info) => info.enterpriseZone?.business;

/* A business answer; undefined while the business fact waits. */
const fromBusiness =
  <T>(pick: (business: EnterpriseZoneBusiness) => T | undefined) =>
  (_: Form, info: Info) => {
    const business = businessOf(info);
    return business === undefined ? undefined : pick(business);
  };

/* An operator's answer (items E to H); blank for an investor. */
const operatorItem = <T>(pick: (business: EnterpriseZoneBusiness) => T | undefined) =>
  fromBusiness((business) => (business.role === "operator" ? pick(business) : undefined));

/*
 * The header and items A to H. An individual files with an SSN or ITIN; the
 * Secretary of State file number is for an LLC or a corporation, so it is
 * blank. "Investors of pass-through entities, complete items A through D"
 * (ca-3805z-booklet-2025::sec::form-ftb-3805z-instructions-for-items-a-through-h::b01).
 */
const header: Bindings = {
  "0.header.identification_number_type": () => "ssn_or_itin",
  "0.header.identification_number": (_, info) => info.taxpayerSSN,
  "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
  "0.header.sos_file_number": () => undefined,
  "0.header.a_entity_type": (_, info) => enterpriseZoneReturnGap(info) ?? "individual",
  "0.header.b_ez_business_name": fromBusiness((business) => business.name),
  "0.header.c_ez_business_address": fromBusiness((business) => business.address),
  "0.header.d_enterprise_zone_name": fromBusiness((business) => business.zoneName),
  "0.header.e_principal_business_activity_code": operatorItem((business) => business.activityCode),
  "0.header.f_total_employees_in_ez": operatorItem((business) => business.employeesInZone),
  "0.header.g_gross_annual_receipts": operatorItem((business) => business.grossReceipts),
  "0.header.h_total_asset_value": operatorItem((business) => business.totalAssetValue),
};

/* A Schedule Z Part I line, or its gap; undefined while it waits. */
const partILine =
  (pick: (figures: PartIFigures) => number) =>
  (form: Form, info: Info): Result<number> => {
    const figures = partIOf(form, info);
    return figures === undefined || isGap(figures) ? figures : pick(figures);
  };

/* A Worksheet II total, or its gap; undefined while it waits. */
const nolLine =
  (pick: (worksheet: NolWorksheet) => number) =>
  (form: Form, info: Info): Result<number> => {
    const gap = enterpriseZoneReturnGap(info);
    if (gap !== undefined) return gap;
    const worksheet = nolFiguresOf(form, info);
    return worksheet === undefined || isGap(worksheet) ? worksheet : pick(worksheet);
  };

/* Part II from line 7, the carryovers and the credit used; a gap; undefined while one waits. */
function partIIOf(form: Form, info: Info): Result<PartII> {
  const figures = partIOf(form, info);
  if (figures === undefined || isGap(figures)) return figures;
  const hiring = info.enterpriseZone?.hiringCarryover;
  const salesOrUse = info.enterpriseZone?.salesTaxCarryover;
  if (hiring === undefined || salesOrUse === undefined) return undefined;
  const used = enterpriseZoneCreditUsed((fieldId) => form[fieldId], info);
  if (used === undefined || isGap(used)) return used;
  return partII(figures.line7, hiring, salesOrUse, used);
}

const partIILine =
  (pick: (lines: PartII) => number) =>
  (form: Form, info: Info): Result<number> => {
    const lines = partIIOf(form, info);
    return lines === undefined || isGap(lines) ? lines : pick(lines);
  };

/* A carryover as stated (columns (b) and (d) of rows 8B and 9B); a gap of the return; undefined while it waits. */
const carryoverLine =
  (pick: (inputs: { hiring: number; salesOrUse: number }) => number) =>
  (_: Form, info: Info): Result<number> => {
    const gap = enterpriseZoneReturnGap(info);
    if (gap !== undefined) return gap;
    const hiring = info.enterpriseZone?.hiringCarryover;
    const salesOrUse = info.enterpriseZone?.salesTaxCarryover;
    if (hiring === undefined || salesOrUse === undefined) return undefined;
    return pick({ hiring, salesOrUse });
  };

/*
 * Line 2: the average apportionment percentage of Worksheet I, Section A
 * line 4, as a percent ("100% (1.00)" for a business entirely within one
 * former zone). Blank for an investor, who does not complete Section A.
 */
function sideOneLine2(_: Form, info: Info): Result<string> {
  const gap = enterpriseZoneReturnGap(info);
  if (gap !== undefined) return gap;
  const business = businessOf(info);
  if (business === undefined) return undefined;
  const percentage = sectionAPercentage(business);
  if (percentage === undefined || isGap(percentage)) return percentage;
  return percentageText(percentage);
}

const sideOne: Bindings = {
  // Line 1a: Schedule Z line 8A column (f); line 1b: line 9A column (f) (the form).
  "0.line.1a_hiring_credit_carryover": partIILine((lines) => lines.line8.aF),
  "0.line.1b_sales_use_tax_credit_carryover": partIILine((lines) => lines.line9.aF),
  "0.line.1c_total_credit_carryover": partIILine((lines) => lines.line8.aF + lines.line9.aF),
  /*
   * Line 1d: the credit the $5,000,000 limit disallows and the taxpayer elects
   * refundable on FTB 3870 (ca-3805z-booklet-2025::sec::line-1d-credit-limitation::b01).
   * A credit available above the limit is a gap (creditUsed.ts), so with the
   * credit figured nothing is disallowed: 0.
   */
  "0.line.1d_credit_elected_refundable": partIILine(() => 0),
  "0.line.2_average_apportionment_percentage": sideOneLine2,
  // Lines 3a to 3c: Worksheet II line 9, columns (b), (c) and (e) (ca-3805z-booklet-2025::sec::form-540-and-form-540nr-filers::b04).
  "0.line.3a_ez_nol_carryover_prior_years": nolLine((worksheet) => worksheet.totalCarryover),
  "0.line.3b_ez_nol_deduction_current_year": nolLine((worksheet) => worksheet.totalDeducted),
  "0.line.3c_ez_nol_carryover_future_years": nolLine((worksheet) => worksheet.totalRemaining),
};

const scheduleZPartI: Bindings = {
  "1.line.1_trade_or_business_income": partILine((figures) => figures.line1),
  // "Corporations: Enter the average apportionment percentage"; individuals skip line 2 (the form).
  "1.line.2_average_apportionment_percentage": (_, info) => enterpriseZoneReturnGap(info),
  "1.line.3_apportioned_business_income": partILine((figures) => figures.line3),
  "1.line.4_ez_nol_deduction": partILine((figures) => figures.line4),
  "1.line.5_ez_taxable_income": partILine((figures) => figures.line5),
  "1.line.6a_tax_on_ez_income": partILine((figures) => figures.line6a),
  "1.line.6b_tax_from_return": partILine((figures) => figures.line6b),
  "1.line.7_ez_income_limitation": partILine((figures) => figures.line7),
};

/*
 * Part II. Column (c) is for "Only C corporations who completed the form
 * [FTB 3544]... Individuals, estates, trusts, leave blank"
 * (ca-3805z-booklet-2025::sec::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b02, ::b04),
 * so column (d) is column (b).
 */
const scheduleZPartII: Bindings = {
  "1.line.8_hiring_credit_row_a_col_e": partILine((figures) => figures.line7),
  "1.line.8_hiring_credit_row_a_col_f": partIILine((lines) => lines.line8.aF),
  "1.line.8_hiring_credit_row_b_col_b": carryoverLine((stated) => stated.hiring),
  "1.line.8_hiring_credit_row_b_col_c": (_, info) => enterpriseZoneReturnGap(info),
  "1.line.8_hiring_credit_row_b_col_d": carryoverLine((stated) => stated.hiring),
  "1.line.8_hiring_credit_row_b_col_e": partIILine((lines) => lines.line8.bE),
  "1.line.8_hiring_credit_row_b_col_g": partIILine((lines) => lines.line8.bG),
  "1.line.9_sales_use_tax_credit_row_a_col_e": partIILine((lines) => lines.line9.aE),
  "1.line.9_sales_use_tax_credit_row_a_col_f": partIILine((lines) => lines.line9.aF),
  "1.line.9_sales_use_tax_credit_row_b_col_b": carryoverLine((stated) => stated.salesOrUse),
  "1.line.9_sales_use_tax_credit_row_b_col_c": (_, info) => enterpriseZoneReturnGap(info),
  "1.line.9_sales_use_tax_credit_row_b_col_d": carryoverLine((stated) => stated.salesOrUse),
  "1.line.9_sales_use_tax_credit_row_b_col_e": partIILine((lines) => lines.line9.bE),
  "1.line.9_sales_use_tax_credit_row_b_col_g": partIILine((lines) => lines.line9.bG),
};

/*
 * Parts III and IV: "Use Part III of Schedule Z only if you are an S
 * corporation" and Part IV "if the corporation or S corporation is subject to
 * paying only the minimum franchise tax"; "All others: Complete Part I and
 * Part II of Schedule Z" (ca-3805z-booklet-2025::sec::part-iii-limitation-of-credits-for-s-corporations-only::b01,
 * ::part-iv-limitation-of-credits-for-corporations-and-s-corporations-subject-to-paying-only-the-minimum-franchise-tax::b01,
 * ::all-others::b01). An individual leaves them blank.
 */
const ENTITY_ONLY_LINES = [
  "1.line.10_hiring_credit_col_b",
  "1.line.10_hiring_credit_col_c",
  "1.line.10_hiring_credit_col_d",
  "1.line.11_sales_use_tax_credit_col_b",
  "1.line.11_sales_use_tax_credit_col_c",
  "1.line.11_sales_use_tax_credit_col_d",
  "1.line.12_hiring_credit_col_b",
  "1.line.12_hiring_credit_col_c",
  "1.line.12_hiring_credit_col_d",
  "1.line.13_sales_use_tax_credit_col_b",
  "1.line.13_sales_use_tax_credit_col_c",
  "1.line.13_sales_use_tax_credit_col_d",
] as const;

const entityOnly: Bindings = Object.fromEntries(
  ENTITY_ONLY_LINES.map((id) => [id, (_: Form, info: Info) => enterpriseZoneReturnGap(info)]),
) as Bindings;

export function register(): void {
  defineForm<Form3805Z, Form3805ZFilingInfo & Info>("form-3805z", {
    bindings: { ...header, ...sideOne, ...scheduleZPartI, ...scheduleZPartII, ...entityOnly },
  });
}
