/* The made-up couple's answers (README.md). */

import { FOREIGN_INCOME_RATE_METHOD_KEY } from "../../../../src/facts/index.js";
import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { thamesSale } from "./assets.js";
import { AMYS_TAX_YEAR, AMYS_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: AMYS_USER_ID, taxYear: AMYS_TAX_YEAR, key, decision, rationale });

export const amysDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the joint threshold."),
  dec("decisions.scope.filing_status", "married_filing_jointly", "Married all year; file jointly."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", true, "One sale in the London custody account."),
  dec(
    `decisions.trade.${thamesSale.tradeId}.form_8949_box`,
    "partI.boxC",
    "A foreign broker sends no Form 1099-B; held under a year.",
  ),
  dec("decisions.scope.has_foreign_trust", false, "No foreign trust."),
  dec(
    FOREIGN_INCOME_RATE_METHOD_KEY,
    "yearly_average",
    "The couple converts the Bologna interest, credited once a year, at the 2025 yearly average.",
  ),
  dec("decisions.itemize_vs_standard", "standard", "No itemized deductions."),
  dec("decisions.scope.must_file_ca_540", false, "Full-year Texas residents."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived in Austin, TX all of 2025."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Refund the whole overpayment; none applied to 2026.",
  ),
];
