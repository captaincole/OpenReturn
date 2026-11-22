/* The made-up child's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { NYNAEVE_TAX_YEAR, NYNAEVE_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: NYNAEVE_USER_ID, taxYear: NYNAEVE_TAX_YEAR, key, decision, rationale });

export const nynaeveDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the single threshold."),
  dec("decisions.scope.filing_status", "single", "Not married."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", false, "No 1099-B or 1099-DA."),
  dec(
    "decisions.itemize_vs_standard",
    "standard",
    "No itemized deductions; nobody can claim her as a dependent (she pays over half of her own support).",
  ),
  dec("decisions.scope.must_file_ca_540", false, "Full-year Washington resident."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived in Spokane, WA all of 2025."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Refund any overpayment; none applied to 2026.",
  ),
];
