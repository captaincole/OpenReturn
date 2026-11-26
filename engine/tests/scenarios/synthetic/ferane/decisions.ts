/* The made-up taxpayer's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { FERANE_TAX_YEAR, FERANE_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: FERANE_USER_ID, taxYear: FERANE_TAX_YEAR, key, decision, rationale });

export const feraneDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the single threshold."),
  dec("decisions.scope.filing_status", "single", "Not married at the end of 2025."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec(
    "decisions.scope.has_reportable_sales",
    false,
    "No 1099-B; the S corporation shares changed hands by agreement in a private sale with no gain or loss stated for 2025.",
  ),
  dec("decisions.itemize_vs_standard", "standard", "No itemized deductions."),
  dec("decisions.scope.must_file_ca_540", false, "Washington resident."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived in Bellevue, WA all of 2025."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Refund the whole overpayment; none applied to 2026.",
  ),
];
