/* The made-up taxpayer's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { GALAD_TAX_YEAR, GALAD_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: GALAD_USER_ID, taxYear: GALAD_TAX_YEAR, key, decision, rationale });

export const galadDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the single threshold."),
  dec("decisions.scope.filing_status", "single", "Not married at the end of 2025."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", false, "No sales of stock or other property."),
  dec("decisions.scope.has_foreign_financial_account", false, "Every account is at a U.S. firm."),
  dec("decisions.scope.has_foreign_trust", false, "No foreign trust."),
  dec("decisions.scope.must_file_schedule_a", true, "He itemizes on Schedule A."),
  dec(
    "decisions.itemize_vs_standard",
    "itemized",
    "Mortgage interest, property tax, sales tax and gifts are more than the standard deduction.",
  ),
  dec(
    "decisions.itemized.elect_general_sales_tax",
    true,
    "Washington has no income tax: Schedule A line 5a takes general sales taxes.",
  ),
  dec("decisions.scope.must_file_ca_540", false, "Full-year Washington resident."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived in Seattle, WA all of 2025."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Refund the whole overpayment; none applied to 2026.",
  ),
];
