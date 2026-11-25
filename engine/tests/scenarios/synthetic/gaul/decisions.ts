/* The made-up taxpayer's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { GAUL_TAX_YEAR, GAUL_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: GAUL_USER_ID, taxYear: GAUL_TAX_YEAR, key, decision, rationale });

export const gaulDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the single threshold."),
  dec("decisions.scope.filing_status", "single", "Not married at the end of 2025."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec(
    "decisions.scope.has_reportable_sales",
    false,
    "The land exchange and the divested stock go on Form 8824: no sale for Form 8949.",
  ),
  dec("decisions.itemize_vs_standard", "standard", "No itemized deductions."),
  dec("decisions.scope.must_file_ca_540", false, "Full-year Texas resident."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived in San Marcos, TX all of 2025."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Refund the whole overpayment; none applied to 2026.",
  ),
];
