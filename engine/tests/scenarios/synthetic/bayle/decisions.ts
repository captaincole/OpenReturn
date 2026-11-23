/* The made-up taxpayer's answers (README.md). */

import { makeForm8949BoxDecisionKey } from "../../../../src/facts/index.js";
import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { BAYLE_TAX_YEAR, BAYLE_USER_ID, SALE_TRADE_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: BAYLE_USER_ID, taxYear: BAYLE_TAX_YEAR, key, decision, rationale });

export const bayleDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the single threshold."),
  dec("decisions.scope.filing_status", "single", "Not married at the end of 2025."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", true, "He sold his partnership interest."),
  dec(
    makeForm8949BoxDecisionKey(SALE_TRADE_ID),
    "partII.boxF",
    "Held more than a year, and no 1099-B reports the sale.",
  ),
  dec("decisions.itemize_vs_standard", "standard", "The standard deduction is larger."),
  dec("decisions.scope.must_file_ca_540", false, "Washington resident."),
  dec(
    "decisions.scope.ca_residency",
    "non_resident",
    "Lived in Bellingham, Washington all of 2025.",
  ),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Refund the whole overpayment; none applied to 2026.",
  ),
];
