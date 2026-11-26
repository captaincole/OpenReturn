/* The made-up taxpayer's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { BERYLLA_TAX_YEAR, BERYLLA_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: BERYLLA_USER_ID, taxYear: BERYLLA_TAX_YEAR, key, decision, rationale });

export const beryllaDecisions: AIDecisionRow[] = [
  dec(
    "decisions.scope.must_file_federal",
    true,
    "Gross income subject to U.S. tax is over her shared standard deduction.",
  ),
  dec("decisions.scope.filing_status", "single", "Not married; she files as single."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", false, "No 1099-B or 1099-DA."),
  dec("decisions.itemize_vs_standard", "standard", "No itemized deductions."),
  dec("decisions.scope.must_file_ca_540", false, "A resident of American Samoa."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived in Pago Pago all of 2025."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Refund the whole overpayment; none applied to 2026.",
  ),
];
