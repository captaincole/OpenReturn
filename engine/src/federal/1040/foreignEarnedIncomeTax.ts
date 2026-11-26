/*
 * MANUAL EDIT: line 16 with Form 2555. "If you claimed the foreign earned
 * income exclusion, housing exclusion, or housing deduction on Form 2555, you
 * must figure your tax using the Foreign Earned Income Tax Worksheet"
 * (irs-1040-inst-2025::sec::foreign-earned-income-tax-work::b01). Without Form
 * 2555, line 16 is what it was.
 */

import type { FormAccessor } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { FilingStatus } from "../../values.js";
import {
  foreignEarnedIncomeTax,
  foreignWorksheetLine3,
} from "../../worksheets/foreignEarnedIncomeTax.js";
import { excludedAmounts, files2555 } from "../2555/results.js";
import type { Form1040FilingInfo } from "./filingInfo.js";
import { qdcgInputsFromReturn, scheduleDWorksheet } from "./qdcgInputs.js";
import type { Form1040 } from "./types.js";

type Form = FormAccessor<Form1040>;

export type ForeignTax =
  | { kind: "none" }
  | { kind: "waiting" }
  | { kind: "gap"; gap: Unsupported }
  | { kind: "tax"; tax: number };

const ITEMIZED_RELATED =
  "Itemized deductions with Form 2555: worksheet line 2b takes the itemized deductions that are definitely related to the excluded income (Pub. 54, irs-pub-54-2025::sec::how-to-report-deductions::b01), which the engine does not figure.";
const SCHEDULE_D_EXCESS =
  "A capital gain excess on the Schedule D Tax Worksheet: the Foreign Earned Income Tax Worksheet changes its lines 9 and 6, Schedule D line 18 and the Unrecaptured Section 1250 Gain Worksheet (irs-1040-inst-2025::sec::foreign-earned-income-tax-worksheet-line-16::b03, b04), which the engine does not model.";

const NONE: ForeignTax = { kind: "none" };
const WAITING: ForeignTax = { kind: "waiting" };

/*
 * Worksheet line 2b: "the total amount of any itemized deductions or
 * exclusions you couldn't claim because they are related to excluded income".
 * With the standard deduction there are none; the exclusions of Form 2555's
 * line 44 are already out of line 45.
 */
function line2b(info: Form1040FilingInfo): number | Unsupported {
  return info.useItemizedDeductions === true ? unsupported(ITEMIZED_RELATED) : 0;
}

/* Line 4 by the Schedule D Tax Worksheet when it applies; a capital gain excess there is a gap. */
function scheduleDLine4(
  form: Form,
  taxable: number,
  line3: number,
  qualifiedDividends: number,
  status: FilingStatus,
): ForeignTax | undefined {
  const worksheet = scheduleDWorksheet(form, line3, qualifiedDividends, status);
  if (worksheet === undefined) return undefined;
  if ((worksheet.breakdown.line10 ?? 0) - taxable > 0) {
    return { kind: "gap", gap: unsupported(SCHEDULE_D_EXCESS) };
  }
  return { kind: "tax", tax: worksheet.tax };
}

/* The worksheet's line 6, the tax on line 16 before the other line 16 taxes. */
export function foreignTaxOnLine16(
  form: Form,
  info: Form1040FilingInfo,
  taxable: number,
  qualifiedDividends: number,
): ForeignTax {
  // "If Form 1040 or 1040-SR, line 15, is zero, don't complete this worksheet."
  if (!files2555(info) || taxable === 0 || !info.filingStatus) return NONE;
  const line2a = excludedAmounts(form, info);
  if (line2a === undefined) return WAITING;
  if (typeof line2a === "object") return { kind: "gap", gap: line2a };
  const disallowed = line2b(info);
  if (typeof disallowed === "object") return { kind: "gap", gap: disallowed };
  const excluded = { line2a, line2b: disallowed };
  const qdcg = qdcgInputsFromReturn(form, taxable, qualifiedDividends, info.filingStatus);
  const lines = foreignEarnedIncomeTax(qdcg, excluded);
  const line3 = foreignWorksheetLine3(taxable, line2a, disallowed);
  const bySchedule = scheduleDLine4(form, taxable, line3, qualifiedDividends, info.filingStatus);
  if (bySchedule === undefined) return { kind: "tax", tax: lines.line6 };
  if (bySchedule.kind !== "tax") return bySchedule;
  return { kind: "tax", tax: Math.max(0, bySchedule.tax - lines.line5) };
}
