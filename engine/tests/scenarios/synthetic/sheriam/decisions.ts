/* The made-up taxpayer's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { SHERIAM_TAX_YEAR, SHERIAM_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: SHERIAM_USER_ID, taxYear: SHERIAM_TAX_YEAR, key, decision, rationale });

export const sheriamDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the filing threshold."),
  dec(
    "decisions.scope.filing_status",
    "married_filing_jointly",
    "Married all of 2025, filing jointly.",
  ),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", false, "No 1099-B or 1099-DA."),
  dec("decisions.itemize_vs_standard", "standard", "No itemized deductions."),
  dec("decisions.scope.must_file_ca_540", false, "Full-year Florida residents."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived in Sarasota, FL all of 2025."),
  dec(
    "decisions.scope.has_foreign_financial_account",
    false,
    "The funds are held at a U.S. broker; no foreign account.",
  ),
  dec("decisions.scope.has_foreign_trust", false, "No foreign trust."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Refund the whole overpayment; none applied to 2026.",
  ),
];
