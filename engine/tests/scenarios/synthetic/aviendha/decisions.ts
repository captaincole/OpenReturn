/* The made-up taxpayer's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { AVIENDHA_TAX_YEAR, AVIENDHA_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: AVIENDHA_USER_ID, taxYear: AVIENDHA_TAX_YEAR, key, decision, rationale });

export const aviendhaDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the single threshold."),
  dec("decisions.scope.filing_status", "single", "Not married at the end of 2025."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", false, "No sales of stock or property."),
  dec("decisions.scope.must_file_schedule_a", true, "She itemizes on Schedule A."),
  dec(
    "decisions.itemize_vs_standard",
    "itemized",
    "Mortgage interest, real estate tax and impairment-related work expenses are more than the standard deduction.",
  ),
  dec("decisions.scope.must_file_ca_540", false, "Full-year Washington resident."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived in Ellensburg, WA all of 2025."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Refund the whole overpayment; none applied to 2026.",
  ),
];
