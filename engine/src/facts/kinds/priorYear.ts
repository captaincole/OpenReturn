/* The 2024 CA balance paid in 2025 is a 2025 payment (Schedule A line 5a), asked with the prior-year answers. */

import type { FactsView } from "../../types.js";

export const PRIOR_YEAR_KEYS = {
  /* Picks the 100% / 110% safe harbor. */
  federalAgi: "prior_year.federal_agi",
  /* 2024 Form 1040 line 22 plus Schedule 2 taxes (the Form 2210 line 8 value). */
  federalTax: "prior_year.federal_tax",
  caTax: "prior_year.ca_tax",
  caBalancePaidThisYear: "prior_year.ca_balance_paid_this_year",
} as const;

export interface PriorYear {
  federalAgi?: number;
  federalTax?: number;
  caTax?: number;
  caBalancePaidThisYear?: number;
  factKeys: string[];
}

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
