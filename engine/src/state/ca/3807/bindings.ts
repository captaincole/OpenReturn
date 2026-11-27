/*
 * FTB 3807, Local Agency Military Base Recovery Area Deduction and Credit
 * Summary, for an individual on Form 540. Items A to H describe the business;
 * Part I takes the credit carryovers Schedule Z allows; Part II is Worksheet I,
 * Section A line 4; Part III is Worksheet II's NOL carryover and deduction.
 * Schedule Z Part I limits the credits to the tax on LAMBRA business income,
 * and Part II splits what Schedule P (540) Section A2 lets the return use
 * (figures.ts, creditUsed.ts, lines.ts). Schedule Z Parts III and IV are for
 * S corporations and corporations only, so an individual leaves them blank.
 */

import { defineForm, type BindingFn, type FormAccessor } from "../../../defineForm.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { roundDollars } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { ratioText } from "../schedule-s/lines.js";
import { lambraCreditUsed } from "./creditUsed.js";
import {
  hasLambraCredit,
  lambraReturnGap,
  partIIOf,
  partIOf,
  worksheetIIOf,
  type Info,
} from "./figures.js";
import type { LambraBusiness } from "./filingInfo.js";
import type { ScheduleZPartI, ScheduleZPartII, WorksheetII } from "./lines.js";
import { BUSINESS_CREDIT_LIMIT, line1c } from "./lines.js";
import type { Form3807 } from "./types.js";

type Form = FormAccessor<Form3807>;
type Bindings = Partial<{ [K in keyof Form3807]: BindingFn<Form3807, Info, K> }>;
type Value = number | Unsupported | undefined;

const isGap = (value: unknown): value is Unsupported =>
  typeof value === "object" && value !== null && "unsupported" in value;
const readOf = (form: Form) => (fieldId: string) => form[fieldId];

/* Items B to D for everyone; items E to H only for a taxpayer who operates the business. */
const item =
  <T extends string | number>(
    pick: (business: LambraBusiness) => T | undefined,
    operatorOnly = false,
  ) =>
  (_: Form, info: Info): T | undefined => {
    const business = info.lambraBusiness;
    if (business === undefined || (operatorOnly && !business.operatesBusiness)) return undefined;
    return pick(business);
  };

/*
 * The header: an individual files with an SSN or ITIN, and the Secretary of
 * State file number is an entity's, so it is blank. Item A is "Individual".
 * "For ... sole proprietors who operate a business in the former LAMBRA,
 * complete items A through H. Investors of pass-through entities, complete
 * items A through D" (ca-3807-booklet-2025::sec::form-ftb-3807-instructions-for-items-a-through-h::b01).
 */
const header: Bindings = {
  "0.header.id_number_type": () => "ssn_or_itin",
  "0.header.id_number": (_, info) => info.taxpayerSSN,
  "0.header.name_on_return": (_, info) => namesOnReturn(info),
  "0.header.sos_file_number": () => undefined,
  "0.header.a_entity_type": () => "individual",
  "0.header.b_lambra_business_name": item((business) => business.businessName),
  "0.header.c_lambra_business_address": item((business) => business.businessAddress),
  "0.header.d_lambra_name": item((business) => business.lambraName),
  "0.header.e_principal_business_activity_code": item(
    (business) => business.principalBusinessActivityCode,
    true,
  ),
  "0.header.f_total_employees_in_lambra": item((business) => business.employees, true),
  "0.header.g_gross_annual_receipts": item(
    (business) => roundDollars(business.grossReceipts),
    true,
  ),
  "0.header.h_total_asset_value": item((business) => roundDollars(business.totalAssets), true),
};

/*
 * Part III and Worksheet II: blank with no LAMBRA NOL carryover above 0 ("Complete
 * Worksheet II first if you have an NOL carryover",
 * ca-3807-booklet-2025::sec::part-i-computation-of-credit-limitations::b01).
 * Line 3a is line 9 column (b), line 3b column (c), line 3c column (e)
 * (::instructions-for-worksheet-ii-computation-of-nol-carryover-and-carryover-limitations::b04).
 */
const nolLine =
  (pick: (figures: WorksheetII) => number) =>
  (form: Form, info: Info): Value => {
    const gap = lambraReturnGap(info);
    if (gap !== undefined) return gap;
    if (!(info.lambraNolCarryovers ?? []).some((row) => row.carryover > 0)) return undefined;
    const figures = worksheetIIOf(readOf(form), info);
    return figures === undefined || isGap(figures) ? figures : pick(figures);
  };

/* Schedule Z is completed "if you have any LAMBRA credits" (::part-i-computation-of-credit-limitations::b01); blank without. */
function withCredit(info: Info): Unsupported | "none" | undefined {
  const gap = lambraReturnGap(info);
  if (gap !== undefined) return gap;
  return hasLambraCredit(info) ? undefined : "none";
}

const partILine =
  (pick: (figures: ScheduleZPartI) => number) =>
  (form: Form, info: Info): Value => {
    const skip = withCredit(info);
    if (skip !== undefined) return skip === "none" ? undefined : skip;
    const figures = partIOf(readOf(form), info);
    return figures === undefined || isGap(figures) ? figures : pick(figures);
  };

const partIILine =
  (pick: (figures: ScheduleZPartII) => number) =>
  (form: Form, info: Info): Value => {
    const skip = withCredit(info);
    if (skip !== undefined) return skip === "none" ? undefined : skip;
    const read = readOf(form);
    const used = lambraCreditUsed(read, info);
    if (used === undefined || isGap(used)) return used;
    const figures = partIIOf(read, info, used);
    return figures === undefined || isGap(figures) ? figures : pick(figures);
  };

/*
 * Line 1d: the credit "disallowed due to the $5,000,000 credit limitation"
 * and elected refundable on FTB 3870 (ca-3807-booklet-2025::sec::line-1d-credit-amount-to-be-elected-as-refundable-in-future-years::b01).
 * Business credits cannot reduce a tax of $5,000,000 or less by more than
 * $5,000,000, so with Form 540 line 35 at most that nothing is disallowed and
 * the line is 0; above it the engine does not figure the limit.
 */
const OVER_LIMIT = unsupported(
  "Line 1d: Form 540 line 35 is over $5,000,000, so the business credit limitation and the FTB 3870 election can apply; the engine does not figure them.",
);
function line1d(form: Form, info: Info): Value {
  const skip = withCredit(info);
  if (skip !== undefined) return skip === "none" ? undefined : skip;
  const figures = partIOf(readOf(form), info);
  if (figures === undefined || isGap(figures)) return figures;
  return figures.line6b > BUSINESS_CREDIT_LIMIT ? OVER_LIMIT : 0;
}

const partI: Bindings = {
  // Line 1a: "Schedule Z, line 8A, column (f)" (the form; ::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b01).
  "0.line.1a_hiring_credit_carryover": partIILine((figures) => figures.line8Af),
  // Line 1b: "Schedule Z, line 9A, column (f)" (the form; ::b03).
  "0.line.1b_sales_use_tax_credit_carryover": partIILine((figures) => figures.line9Af),
  "0.line.1c_total_credit_carryover": partIILine((figures) =>
    line1c(figures.line8Af, figures.line9Af),
  ),
  "0.line.1d_credit_elected_refundable": line1d,
  /*
   * Line 2: Worksheet I, Section A line 4; "If your operation is wholly within
   * the former LAMBRA, the average apportionment percentage is 100% (1.00)"
   * (the form). Blank for an investor who completes no Section A. Printed as a
   * decimal with four places.
   */
  "0.line.2_average_apportionment_percentage": (_, info) => {
    const share = info.lambraBusiness?.apportionment;
    return share === undefined ? undefined : ratioText(share);
  },
  "0.line.3a_nol_carryover_prior_years": nolLine((figures) => figures.totalCarryover),
  "0.line.3b_nol_deduction_current_year": nolLine((figures) => figures.totalDeducted),
  "0.line.3c_nol_carryover_future_years": nolLine((figures) => figures.totalFuture),
};

const scheduleZPartI: Bindings = {
  "1.line.1_trade_or_business_income": partILine((figures) => figures.line1),
  // "Corporations: Enter the average apportionment percentage"; individuals "skip line 2" (the form).
  "1.line.2_average_apportionment_percentage": () => undefined,
  "1.line.3_apportioned_business_income": partILine((figures) => figures.line3),
  "1.line.4_lambra_nol_deduction": partILine((figures) => figures.line4),
  "1.line.5_lambra_taxable_income": partILine((figures) => figures.line5),
  "1.line.6a_tax_on_lambra_income": partILine((figures) => figures.line6a),
  "1.line.6b_tax_from_return": partILine((figures) => figures.line6b),
  "1.line.7_lambra_income_limitation": partILine((figures) => figures.line7),
};

/*
 * DECISION (2026-11-26, by the author): line 8B column (b), the hiring credit
 * carried from last year, is last year's line 8B column (g).
 * - The instruction: "Line 8B, column (b) – Enter the amount of the total prior
 *   year credit carryover from prior year's Schedule Z, Part II, line 9B,
 *   column (g)" (ca-3807-booklet-2025::sec::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b01).
 * - The form: line 8 is "Hiring credit carryover" and line 9 "Sales or use tax
 *   credit carryover"; line 8B column (g) is the hiring credit's "Total credit
 *   carryover col. (d) minus col. (e)" (the form), and line 9B column (b) is
 *   read from last year's line 9B column (g) (::b03).
 * The engine follows the form: line 9B holds the other credit, so the line 8B
 * instruction names the wrong line. The fact the taxpayer states is the hiring
 * carryover (facts/kinds/caLambra.ts); no dollars change in the engine.
 * An individual leaves column (c) blank: "Individuals, estates, and trusts,
 * leave blank" (::b02, ::b04).
 */
const scheduleZPartII: Bindings = {
  "1.line.8a_hiring_credit_carryover_col_e": partIILine((figures) => figures.line8Ae),
  "1.line.8a_hiring_credit_carryover_col_f": partIILine((figures) => figures.line8Af),
  "1.line.8b_hiring_credit_carryover_col_b": partIILine((figures) => figures.line8Bb),
  "1.line.8b_hiring_credit_carryover_col_c": () => undefined,
  "1.line.8b_hiring_credit_carryover_col_d": partIILine((figures) => figures.line8Bd),
  "1.line.8b_hiring_credit_carryover_col_e": partIILine((figures) => figures.line8Be),
  "1.line.8b_hiring_credit_carryover_col_g": partIILine((figures) => figures.line8Bg),
  "1.line.9a_sales_use_tax_credit_carryover_col_e": partIILine((figures) => figures.line9Ae),
  "1.line.9a_sales_use_tax_credit_carryover_col_f": partIILine((figures) => figures.line9Af),
  "1.line.9b_sales_use_tax_credit_carryover_col_b": partIILine((figures) => figures.line9Bb),
  "1.line.9b_sales_use_tax_credit_carryover_col_c": () => undefined,
  "1.line.9b_sales_use_tax_credit_carryover_col_d": partIILine((figures) => figures.line9Bd),
  "1.line.9b_sales_use_tax_credit_carryover_col_e": partIILine((figures) => figures.line9Be),
  "1.line.9b_sales_use_tax_credit_carryover_col_g": partIILine((figures) => figures.line9Bg),
};

/*
 * Schedule Z Part III, "Limitation of Credits for S Corporations Only", and
 * Part IV, for "Corporations and S Corporations Subject to Paying Only the
 * Minimum Franchise Tax" (the form; ::part-iii-limitation-of-credits-for-s-corporations-only::b01,
 * ::part-iv-...::b01). An individual uses Part II, so both parts are blank.
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

const entityOnly: Bindings = Object.fromEntries(
  ENTITY_ONLY_LINES.map((id) => [id, () => undefined]),
);

export function register(): void {
  defineForm<Form3807, Info>("form-3807", {
    bindings: { ...header, ...partI, ...scheduleZPartI, ...scheduleZPartII, ...entityOnly },
  });
}
