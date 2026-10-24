/*
 * Prior-year facts. The underpayment safe harbors compare this year's
 * payments with last year's tax: federal Form 2210 and California FTB
 * 5805. The taxpayer reads the values from last year's return.
 *
 * Convention:
 *   category: "estimated_payments"
 *   keys:     see PRIOR_YEAR_KEYS
 *
 * The 2024 CA balance paid in 2025 is a 2025 payment, not a prior-year
 * value. It lives here because the taxpayer gives it in the same
 * answer. It feeds federal Schedule A line 5a (state income tax paid).
 */

import type { FactsView } from "../../types.js";

export const PRIOR_YEAR_KEYS = {
  /* 2024 Form 1040 line 11 (AGI). Picks the 100% / 110% safe harbor. */
  federalAgi: "prior_year.federal_agi",
  /* 2024 Form 1040 line 22 plus Schedule 2 taxes (the Form 2210 line 8 value). */
  federalTax: "prior_year.federal_tax",
  /* 2024 Form 540 total tax (the FTB 5805 prior-year value). */
  caTax: "prior_year.ca_tax",
  /* Balance due on the 2024 CA return, paid during 2025. */
  caBalancePaidThisYear: "prior_year.ca_balance_paid_this_year",
} as const;

export interface PriorYear {
  federalAgi?: number;
  federalTax?: number;
  caTax?: number;
  caBalancePaidThisYear?: number;
  factKeys: string[];
}

/** Read the prior-year answers. Absent answers stay undefined. */
export function getPriorYear(facts: FactsView): PriorYear {
  const out: PriorYear = { factKeys: [] };
  const read = (key: string): number | undefined => {
    const row = facts.get(key);
    if (row === undefined) return undefined;
    out.factKeys.push(key);
    return row.value as number;
  };
  out.federalAgi = read(PRIOR_YEAR_KEYS.federalAgi);
  out.federalTax = read(PRIOR_YEAR_KEYS.federalTax);
  out.caTax = read(PRIOR_YEAR_KEYS.caTax);
  out.caBalancePaidThisYear = read(PRIOR_YEAR_KEYS.caBalancePaidThisYear);
  return out;
}
