/* The made-up couple's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { ELAIDA_TAX_YEAR, ELAIDA_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: ELAIDA_USER_ID, taxYear: ELAIDA_TAX_YEAR, key, decision, rationale });

export const elaidaDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the joint threshold."),
  dec(
    "decisions.scope.filing_status",
    "married_filing_jointly",
    "Married all year, filing together.",
  ),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", false, "No sales of stock or other property."),
  dec("decisions.itemize_vs_standard", "standard", "The standard deduction is larger."),
  dec("decisions.scope.must_file_ca_540", false, "Washington residents."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived in Spokane, Washington all of 2025."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Refund the whole overpayment; none applied to 2026.",
  ),
];
