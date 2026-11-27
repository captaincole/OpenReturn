/* The made-up nonresident's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { RIANNA_TAX_YEAR, RIANNA_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: RIANNA_USER_ID, taxYear: RIANNA_TAX_YEAR, key, decision, rationale });

export const riannaDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the single threshold."),
  dec("decisions.scope.filing_status", "single", "Divorced in 2021; not married in 2025."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", false, "No sales of stock or other property."),
  dec("decisions.itemize_vs_standard", "standard", "No itemized deductions."),
  dec("decisions.scope.has_foreign_financial_account", false, "No foreign accounts."),
  dec("decisions.scope.has_foreign_trust", false, "No foreign trust."),
  dec(
    "decisions.scope.ca_residency",
    "non_resident",
    "She says she has lived in Reno, Nevada all of 2025 and for years before.",
  ),
  dec(
    "decisions.scope.must_file_540nr",
    true,
    "A nonresident with California wages and a California rental; gross income from all sources is over the single chart amount (Step 1).",
  ),
  dec("decisions.scope.must_file_ca_540", false, "A nonresident files Form 540NR."),
  dec("decisions.refund.refund_full_overpayment_federal", true, "Refund any overpayment."),
];
