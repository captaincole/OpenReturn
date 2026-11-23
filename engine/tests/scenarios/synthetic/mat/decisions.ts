/* The made-up couple's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { MAT_TAX_YEAR, MAT_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: MAT_USER_ID, taxYear: MAT_TAX_YEAR, key, decision, rationale });

export const matDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the MFJ threshold."),
  dec(
    "decisions.scope.filing_status",
    "married_filing_jointly",
    "Married all year, filing together.",
  ),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", false, "No sales of stock or other property."),
  dec("decisions.scope.has_foreign_financial_account", false, "No foreign accounts."),
  dec("decisions.scope.has_foreign_trust", false, "The family trust is a U.S. trust."),
  dec("decisions.itemize_vs_standard", "standard", "No itemized deductions."),
  dec("decisions.scope.must_file_ca_540", false, "Texas residents."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived in Austin, Texas all of 2025."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Refund any overpayment; none applied to 2026.",
  ),
];
