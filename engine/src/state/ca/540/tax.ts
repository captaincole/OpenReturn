/* Form 540 tax: lines 31 to 35. */

import { lookupCaRateSchedule } from "../../../data/caRateSchedule.js";
import { lookupTax } from "../../../data/taxTable.js";
import { atLeast, roundDollars, sum } from "../../../money.js";
import { caExemptionCreditsAfterLimit } from "../../../worksheets/caAgiLimitation.js";
import type { Form540Line } from "./form540Binding.js";

// MANUAL EDIT: FTB sends line 19 over $100,000 to the Tax Rate Schedules.
function usesRateSchedule(taxableIncome: number | undefined): boolean | undefined {
  return typeof taxableIncome === "number" ? taxableIncome > 100000 : undefined;
}

// MANUAL EDIT: line 31 source checkbox: Tax Table up to $100,000, else Tax Rate Schedule.
export const line31TaxFromTaxTable: Form540Line<"line.31_tax_from_tax_table"> = (form) =>
  usesRateSchedule(form["line.19_taxable_income"]) === false;
export const line31TaxFromRateSchedule: Form540Line<"line.31_tax_from_rate_schedule"> = (form) =>
  usesRateSchedule(form["line.19_taxable_income"]);

// MANUAL EDIT: Tax Table ("ca-2025") up to $100,000 of line 19; above it, Tax Rate Schedules X/Y/Z.
export const line31TaxAmount: Form540Line<"line.31_tax_amount"> = (form, info) => {
  if (!info.filingStatus) return undefined;
  const income = form["line.19_taxable_income"];
  if (typeof income !== "number") return undefined;
  if (income === 0) return 0; // the table starts at $1
  if (usesRateSchedule(income)) {
    return roundDollars(lookupCaRateSchedule(2025, info.filingStatus, income));
  }
  const lookup = lookupTax("ca-2025", income, info.filingStatus);
  return lookup.ok ? lookup.tax : undefined;
};

/*
 * MANUAL EDIT: line 11, limited by the AGI Limitation Worksheet.
 */
export const line32ExemptionCredits: Form540Line<"line.32_exemption_credits"> = (form, info) => {
  const agi = form["line.13_federal_agi"];
  const count = form["line.7_personal_exemption_count"];
  if (!info.filingStatus || typeof agi !== "number" || typeof count !== "number") {
    return sum(form["line.11_total_exemption_amount"]);
  }
  return caExemptionCreditsAfterLimit({
    filingStatus: info.filingStatus,
    federalAgi: agi,
    // Worksheet line f: the exemptions on lines 7, 8, and 9.
    personalCount: sum(
      count,
      form["line.8_blind_exemption_count"],
      form["line.9_senior_exemption_count"],
    ),
    personalAmount: sum(
      form["line.7_personal_exemption_amount"],
      form["line.8_blind_exemption_amount"],
      form["line.9_senior_exemption_amount"],
    ),
    dependentCount: sum(form["line.10_dependent_exemption_count"]),
    dependentAmount: sum(form["line.10_dependent_exemption_amount"]),
  });
};

export const line33TaxAfterExemptionCredits: Form540Line<"line.33_tax_after_exemption_credits"> = (
  form,
) => {
  const tax = form["line.31_tax_amount"];
  if (typeof tax !== "number") return undefined;
  return atLeast(
    0,
    sum(
      tax,
      form["line.32_exemption_credits"] === undefined ? 0 : -form["line.32_exemption_credits"],
    ),
  );
};

export const line35TotalTaxAfterCredits: Form540Line<"line.35_total_tax_after_credits"> = (
  form,
) => {
  const tax = form["line.33_tax_after_exemption_credits"];
  return typeof tax === "number" ? sum(tax, form["line.34_tax_amount"]) : undefined;
};
