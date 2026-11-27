/* The made-up couple's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { GHEALDAN_TAX_YEAR, GHEALDAN_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: GHEALDAN_USER_ID, taxYear: GHEALDAN_TAX_YEAR, key, decision, rationale });

export const ghealdanDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "They claim the earned income credit."),
  dec(
    "decisions.scope.filing_status",
    "married_filing_jointly",
    "Married all of 2025, filing jointly.",
  ),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", false, "No 1099-B or 1099-DA."),
  dec("decisions.itemize_vs_standard", "standard", "No itemized deductions."),
  dec("decisions.scope.must_file_ca_540", false, "Full-year Nevada residents."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived in Elko, NV all of 2025."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Refund the whole overpayment; none applied to 2026.",
  ),
];
