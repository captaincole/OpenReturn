/*
 * Form 8801: last year's minimum tax, as the taxpayer states it from the 2024
 * return. Every input of Parts I and III and lines 16, 19 and 20 is a 2024
 * amount (irs-8801-inst-2025::sec::who-should-file::b01). The common case: the
 * taxpayer exercised incentive stock options in 2024 and paid AMT for it.
 * The return is not read (#79); Cade asks for these lines.
 */

import type { FilingStatus } from "../../values.js";

export const PRIOR_YEAR_MINIMUM_TAX_KEYS = {
  /*
   * The 2024 filing status, the box checked on page 1 of the 2024 Form 1040: it
   * picks the 2024 amounts on lines 4, 5, 6, 11, 33, 34, 40 and 54.
   */
  filingStatus: "prior_year.filing_status",
  /* The 2024 Form 6251 lines as printed, all on its page 1 (PriorYearForm6251). */
  form6251: "prior_year.form_6251",
  /*
   * Line 2's other part, a number (0 when none): the exclusion items not on 2024
   * Form 6251 lines 2a–2d, 2g and 2h. Schedule K-1 (Form 1041) box 12 code J,
   * the exclusion items in line 3, and an exclusion item put on another line
   * (irs-8801-inst-2025::sec::line-2::b01, b02). Never the line 2j amount.
   */
  otherExclusionItems: "prior_year.amt_other_exclusion_items",
  /*
   * Line 3: the minimum tax credit net operating loss deduction, a positive
   * number (the form prints it in parentheses); 0 when no net operating loss
   * was carried to 2024. The MTCNOL carryovers and carrybacks to 2024, figured
   * with only exclusion items (irs-8801-inst-2025::sec::line-3::b01, b02). No
   * filed 2024 page prints it: it comes from the 2024 net operating loss
   * carryover worksheets (a preparer's MTCNOL schedule). Asked on every return
   * that files the form: a carryover can exist with no 2024 Form 6251 line 2e.
   */
  minimumTaxCreditNolDeduction: "prior_year.amt_mtcnol_deduction",
  /* Line 19: 2024 Form 8801 line 26 (page 2), a number (0 when no 2024 Form 8801 or none). */
  creditCarryforward: "prior_year.form_8801_line_26",
  /*
   * Line 20: a 2024 qualified electric vehicle credit not allowed only because
   * of the old section 30(b)(3)(B) limit (irs-8801-inst-2025::sec::part-ii-minimum-tax-credit-and::b01).
   * Recorded only when the taxpayer has one; absent means none.
   */
  unallowedElectricVehicleCredit: "prior_year.unallowed_qualified_electric_vehicle_credit",
  /* Line 11 and Part III: the 2024 capital gain worksheet (PriorYearCapitalGainWorksheet). */
  capitalGainWorksheet: "prior_year.capital_gain_worksheet",
  /* Lines 11 and 27: true when a 2024 Form 2555 was filed (either spouse). */
  filedForm2555: "prior_year.filed_form_2555",
  /* Line 12: how the 2024 foreign tax credit was claimed (PriorYearForeignTaxCredit). */
  foreignTaxCredit: "prior_year.foreign_tax_credit",
} as const;

/*
 * The 2024 Form 6251 lines the form reads. Each holds the sign the line printed
 * (line 2b is negative; 2c and 2d can be). A line left blank on the 2024 form
 * is absent here. Lines 1, 10 and 11 always print.
 */
export interface PriorYearForm6251 {
  /* Line 1: 2024 Form 1040 line 15, or less than zero when that return said so. */
  line1: number;
  /* Lines 2a–2d, 2g, 2h: the exclusion items line 2 combines (line-2::b01). */
  line2a?: number;
  line2b?: number;
  line2c?: number;
  line2d?: number;
  /* Line 2e: the net operating loss deduction, a positive amount. Line 1 adds it. */
  line2e?: number;
  line2g?: number;
  line2h?: number;
  /* Line 8: the 2024 AMT foreign tax credit. Above 0, line 12 asks how the credit was claimed. */
  line8?: number;
  /* Line 10: the 2024 regular tax less credits (Form 8801 line 14). */
  line10: number;
  /* Line 11: the 2024 AMT (Form 8801 line 16). */
  line11: number;
}

/*
 * The 2024 worksheet behind line 11 and Part III. "none": the 2024 return had no
 * capital gain distributions on Form 1040 line 7, no qualified dividends on line
 * 3a, and no gain on both Schedule D lines 15 and 16; line 11 then uses the AMT
 * rates. Otherwise the worksheet the 2024 tax used, as filled. Neither worksheet
 * is a filed page: it is in the 2024 records (the Form 1040 or Schedule D
 * instructions' worksheet, or a preparer's copy). A 2024 taxable
 * income of zero or less used no worksheet: the taxpayer completes the first
 * lines of one for this form (irs-8801-inst-2025::sec::part-iii-tax-computation-using::b01),
 * and the lines after them are 0.
 */
export type PriorYearCapitalGainWorksheet =
  | { worksheet: "none" }
  | {
      worksheet: "qualified_dividends_capital_gain";
      /* Line 4, as refigured for the AMT when an AMT amount differs (Form 8801 line 28). */
      line4: number;
      /* Line 5 (Form 8801 lines 35 and 42). */
      line5: number;
    }
  | {
      worksheet: "schedule_d";
      /* Line 10 (Form 8801 line 30's cap). */
      line10: number;
      /* Line 13, as refigured for the AMT when an AMT amount differs (Form 8801 line 28). */
      line13: number;
      /* Line 14 (Form 8801 line 35). */
      line14: number;
      /* Line 21 (Form 8801 line 42). */
      line21: number;
      /* 2024 Schedule D line 19, unrecaptured section 1250 gain (Form 8801 line 29). */
      scheduleDLine19: number;
    };

/*
 * The 2024 foreign tax credit, asked when 2024 Form 6251 line 8 is above 0. The
 * election without Form 1116 makes line 12 the 2024 Schedule 3 line 1 amount
 * (irs-8801-inst-2025::sec::line-12::b01).
 */
export type PriorYearForeignTaxCredit =
  { method: "election_without_form_1116"; scheduleThreeLine1: number } | { method: "form_1116" };

/* The answers as recorded; each is undefined while unstated. */
export interface PriorYearMinimumTax {
  filingStatus?: FilingStatus;
  form6251?: PriorYearForm6251;
  otherExclusionItems?: number;
  minimumTaxCreditNolDeduction?: number;
  creditCarryforward?: number;
  unallowedElectricVehicleCredit?: number;
  capitalGainWorksheet?: PriorYearCapitalGainWorksheet;
  filedForm2555?: boolean;
  foreignTaxCredit?: PriorYearForeignTaxCredit;
}

const FILING_STATUSES: ReadonlySet<unknown> = new Set<FilingStatus>([
  "single",
  "married_filing_jointly",
  "married_filing_separately",
  "head_of_household",
  "qualifying_surviving_spouse",
]);

const numberOf = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const objectOf = <T>(value: unknown): T | undefined =>
  typeof value === "object" && value !== null ? (value as T) : undefined;

/* Read every answer from the facts by key. */
export function getPriorYearMinimumTax(
  factByKey: ReadonlyMap<string, unknown>,
): PriorYearMinimumTax {
  const keys = PRIOR_YEAR_MINIMUM_TAX_KEYS;
  const status = factByKey.get(keys.filingStatus);
  const filedForm2555 = factByKey.get(keys.filedForm2555);
  return {
    filingStatus: FILING_STATUSES.has(status) ? (status as FilingStatus) : undefined,
    form6251: objectOf<PriorYearForm6251>(factByKey.get(keys.form6251)),
    otherExclusionItems: numberOf(factByKey.get(keys.otherExclusionItems)),
    minimumTaxCreditNolDeduction: numberOf(factByKey.get(keys.minimumTaxCreditNolDeduction)),
    creditCarryforward: numberOf(factByKey.get(keys.creditCarryforward)),
    unallowedElectricVehicleCredit: numberOf(factByKey.get(keys.unallowedElectricVehicleCredit)),
    capitalGainWorksheet: objectOf<PriorYearCapitalGainWorksheet>(
      factByKey.get(keys.capitalGainWorksheet),
    ),
    filedForm2555: typeof filedForm2555 === "boolean" ? filedForm2555 : undefined,
    foreignTaxCredit: objectOf<PriorYearForeignTaxCredit>(factByKey.get(keys.foreignTaxCredit)),
  };
}

/*
 * The minimum tax answers recorded: the facts that put Form 8801 in scope. The
 * 2024 filing status is not one: other forms may ask it.
 */
export function priorYearMinimumTaxKeysOnFile(factByKey: ReadonlyMap<string, unknown>): string[] {
  const { filingStatus: _status, ...scopeKeys } = PRIOR_YEAR_MINIMUM_TAX_KEYS;
  return Object.values(scopeKeys).filter((key) => factByKey.has(key));
}
