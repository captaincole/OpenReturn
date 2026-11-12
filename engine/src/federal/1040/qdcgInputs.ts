/*
 * MANUAL EDIT: the QDCG worksheet inputs that come from the return. Form 1040
 * line 16 and Form 6251 Part III (the regular-tax worksheet's lines 4 and 5)
 * both read them, so both figure the same worksheet.
 */

import { atLeast } from "../../money.js";
import type { FilingStatus } from "../../values.js";
import type { QdcgInputs } from "../../worksheets/qdcg.js";

/** Any form's accessor: full field ids ("schedule-d.0.line.15_…") resolve from every form. */
type ReturnAccessor = { readonly [fieldId: string]: unknown };

/* Worksheet line 3: the smaller of Schedule D lines 15 and 16 (a loss counts as 0). */
function netLongTermGain(form: ReturnAccessor): number {
  const schDL15 = form["schedule-d.0.line.15_net_long_term_gain_loss"];
  const schDL16 = form["schedule-d.1.line.16_combined_gain_loss"];
  if (schDL15 !== undefined || schDL16 !== undefined) {
    const candL15 = typeof schDL15 === "number" ? atLeast(0, schDL15) : 0;
    const candL16 = typeof schDL16 === "number" ? atLeast(0, schDL16) : 0;
    return Math.min(candL15, candL16);
  }
  // Worksheet line 3 "No" branch: no Schedule D, so use line 7a.
  const l7a = form["form-1040.line.7a"];
  return typeof l7a === "number" ? atLeast(0, l7a) : 0;
}

export function qdcgInputsFromReturn(
  form: ReturnAccessor,
  taxableIncome: number,
  qualifiedDividends: number,
  filingStatus: FilingStatus,
): QdcgInputs {
  const form4952L4g = form["form-4952.0.line.4g_elected_investment_income"];
  return {
    taxableIncome,
    qualifiedDividends,
    netLongTermGain: netLongTermGain(form),
    // MANUAL EDIT: Form 4952 line 4g leaves the preferential rates (Schedule D Tax Worksheet line 3).
    form4952Line4g: typeof form4952L4g === "number" ? form4952L4g : 0,
    // TODO: the Foreign Earned Income Tax Worksheet, when Form 2555 lands.
    filingForm2555: false,
    filingStatus,
    taxYear: 2025,
  };
}
