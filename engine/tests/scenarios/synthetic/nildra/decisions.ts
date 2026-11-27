/* The made-up part-year resident's answers (README.md). */

import { makeForm8949BoxDecisionKey } from "../../../../src/facts/index.js";
import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { NILDRA_BOXES, NILDRA_TAX_YEAR, NILDRA_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: NILDRA_USER_ID, taxYear: NILDRA_TAX_YEAR, key, decision, rationale });

export const nildraDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the single threshold."),
  dec("decisions.scope.filing_status", "single", "Divorced in 2014; not remarried."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", true, "Three sales of shares on a 1099-B."),
  dec("decisions.itemize_vs_standard", "standard", "No itemized deductions."),
  dec("decisions.scope.has_foreign_financial_account", false, "No foreign accounts."),
  dec("decisions.scope.has_foreign_trust", false, "No foreign trust."),
  dec(
    "decisions.scope.ca_residency",
    "part_year",
    "She lived in Portland, Oregon until August 31, 2025, then moved to San Diego for good.",
  ),
  dec(
    "decisions.scope.must_file_540nr",
    true,
    "A part-year resident with $114,000 of wages: gross income is over the single chart amount (Step 1).",
  ),
  dec("decisions.scope.must_file_ca_540", false, "A part-year resident files Form 540NR."),
  dec("decisions.refund.refund_full_overpayment_federal", true, "Refund any overpayment."),
  dec("decisions.refund.refund_full_overpayment_ca", true, "Refund any California overpayment."),
  ...Object.entries(NILDRA_BOXES).map(([tradeId, box]) =>
    dec(makeForm8949BoxDecisionKey(tradeId), box, `The broker reported this sale in ${box}.`),
  ),
];
