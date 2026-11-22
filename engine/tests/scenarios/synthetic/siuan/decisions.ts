/* The made-up taxpayer's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { SIUAN_TAX_YEAR, SIUAN_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: SIUAN_USER_ID, taxYear: SIUAN_TAX_YEAR, key, decision, rationale });

export const siuanDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the single threshold."),
  dec("decisions.scope.filing_status", "single", "Widowed before 2023 and not remarried."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", false, "No sales of stock or other property."),
  dec("decisions.itemize_vs_standard", "standard", "No itemized deductions."),
  dec("decisions.scope.must_file_ca_540", false, "Nevada resident."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived in Nevada all of 2025."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Refund the whole overpayment; none applied to 2026.",
  ),
];
