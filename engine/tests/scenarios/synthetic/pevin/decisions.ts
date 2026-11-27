/* The made-up part-year resident's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { PEVIN_TAX_YEAR, PEVIN_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: PEVIN_USER_ID, taxYear: PEVIN_TAX_YEAR, key, decision, rationale });

export const pevinDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the single threshold."),
  dec("decisions.scope.filing_status", "single", "Never married."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", false, "No sales in 2025."),
  dec(
    "decisions.scope.must_file_schedule_a",
    true,
    "Medical, taxes, mortgage interest and gifts beat the standard deduction.",
  ),
  dec(
    "decisions.itemize_vs_standard",
    "itemized",
    "Her itemized deductions beat the standard deduction.",
  ),
  dec("decisions.scope.has_foreign_financial_account", false, "No foreign accounts."),
  dec("decisions.scope.has_foreign_trust", false, "No foreign trust."),
  dec(
    "decisions.scope.ca_residency",
    "part_year",
    "She lived in San Jose until September 30, 2025, then moved to Reno, Nevada for good.",
  ),
  dec(
    "decisions.scope.must_file_540nr",
    true,
    "A part-year resident with $262,000 of wages: gross income is over the single chart amount (Step 1).",
  ),
  dec("decisions.scope.must_file_ca_540", false, "A part-year resident files Form 540NR."),
  dec("decisions.refund.refund_full_overpayment_federal", true, "Refund any overpayment."),
  dec("decisions.refund.refund_full_overpayment_ca", true, "Refund any overpayment."),
];
