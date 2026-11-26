/* The made-up farmer's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { AILIL_TAX_YEAR, AILIL_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: AILIL_USER_ID, taxYear: AILIL_TAX_YEAR, key, decision, rationale });

export const aililDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the single threshold."),
  dec("decisions.scope.filing_status", "single", "Never married."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec(
    "decisions.scope.has_reportable_sales",
    false,
    "No sales of stock or other property in 2025.",
  ),
  dec("decisions.itemize_vs_standard", "standard", "No itemized deductions."),
  dec("decisions.scope.has_foreign_financial_account", false, "No foreign accounts."),
  dec("decisions.scope.has_foreign_trust", false, "No foreign trust."),
  dec("decisions.scope.must_file_ca_540", false, "Full-year Texas resident."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived on the farm in Texas all of 2025."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Refund the whole overpayment; none applied to 2026.",
  ),
];
