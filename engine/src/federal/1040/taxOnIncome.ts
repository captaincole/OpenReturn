/*
 * MANUAL EDIT: the 2025 tax on an amount of taxable income by the methods of
 * line 16 (irs-1040-inst-2025::sec::line-16::b01): the Foreign Earned Income
 * Tax Worksheet with Form 2555, the Schedule D Tax Worksheet when Schedule D
 * line 19 has an amount, else the QDCG worksheet (the Tax Table or the Tax
 * Computation Worksheet with no preferential income). Line 16 figures it on
 * line 15; Schedule J line 4 on its line 3 ("Figure the tax on the amount on
 * line 3 using: The 2025 Tax Table, Tax Computation Worksheet, or Qualified
 * Dividends and Capital Gain Tax Worksheet ...; The 2025 Foreign Earned
 * Income Tax Worksheet ...; or The Schedule D Tax Worksheet",
 * irs-1040sj-inst-2025::sec::line-4::b01); Form 6251 line 10 on line 15 again,
 * "without using Schedule J" (irs-6251-inst-2025::sec::line-10::b02).
 */

import { lookupTax } from "../../data/taxTable.js";
import { numberOrBlank } from "../../money.js";
import type { Unsupported } from "../../types.js";
import { computeQdcg } from "../../worksheets/qdcg.js";
import { childTaxOnLine16 } from "../8615/form.js";
import type { Form1040FilingInfo } from "./filingInfo.js";
import { foreignTaxOnLine16 } from "./foreignEarnedIncomeTax.js";
import { line3a } from "./form8814Lines.js";
import {
  NO_GAIN_LEFT_OUT,
  qdcgInputsFromReturn,
  scheduleDWorksheetTax,
  type GainLeftOut,
} from "./qdcgInputs.js";

/* Any form's accessor: every read is by full field id. */
type Form = { readonly [fieldId: string]: unknown };

/*
 * The tax on the amount; undefined while an input waits. `left` is the
 * capital gain Schedule J moves to the base years (none for line 16).
 */
export function taxOnIncome(
  form: Form,
  info: Form1040FilingInfo,
  amount: number,
  left: GainLeftOut = NO_GAIN_LEFT_OUT,
): number | Unsupported | undefined {
  const status = info.filingStatus;
  if (!status) return undefined;
  // Worksheet line 2 = 1040 line 3a as entered (a rounded document sum).
  const qualifiedDividends = numberOrBlank(line3a(info)) ?? 0;
  const foreign = foreignTaxOnLine16(form, info, amount, qualifiedDividends, left);
  if (foreign.kind === "waiting") return undefined;
  if (foreign.kind === "gap") return foreign.gap;
  if (foreign.kind === "tax") return foreign.tax;
  try {
    const qdcg = computeQdcg(qdcgInputsFromReturn(form, amount, qualifiedDividends, status, left));
    return scheduleDWorksheetTax(form, amount, qualifiedDividends, status, left) ?? qdcg.tax;
  } catch {
    // Unknown filing status or missing table data: use the plain tax table.
    const lookup = lookupTax("federal-2025", amount, status);
    return lookup.ok ? lookup.tax : undefined;
  }
}

/*
 * Line 16's tax on line 15 without Schedule J: a child who files Form 8615
 * enters its line 18 (irs-8615-inst-2025::sec::line-18::b01); else the tax
 * on line 15.
 */
export function taxWithoutScheduleJ(
  form: Form,
  info: Form1040FilingInfo,
  taxable: number,
): number | Unsupported | undefined {
  const childTax = childTaxOnLine16(form, info);
  return childTax === "regular" ? taxOnIncome(form, info, taxable) : childTax;
}
