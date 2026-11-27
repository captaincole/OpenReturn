/* The made-up nonresident's answers (README.md). */

import { makeForm8949BoxDecisionKey } from "../../../../src/facts/index.js";
import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { OLMIRA_BOXES, OLMIRA_TAX_YEAR, OLMIRA_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: OLMIRA_USER_ID, taxYear: OLMIRA_TAX_YEAR, key, decision, rationale });

export const olmiraDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the single threshold."),
  dec("decisions.scope.filing_status", "single", "Never married."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", true, "Two sales of shares on a 1099-B."),
  dec("decisions.itemize_vs_standard", "standard", "No itemized deductions."),
  dec("decisions.scope.has_foreign_financial_account", false, "No foreign accounts."),
  dec("decisions.scope.has_foreign_trust", false, "No foreign trust."),
  dec("decisions.scope.ca_residency", "non_resident", "She lived in Reno, Nevada all of 2025."),
  dec(
    "decisions.scope.must_file_540nr",
    true,
    "A nonresident with California-source wages; gross income is over the single chart amount.",
  ),
  dec("decisions.scope.must_file_ca_540", false, "A nonresident files Form 540NR."),
  dec("decisions.refund.refund_full_overpayment_federal", true, "Refund any overpayment."),
  dec("decisions.refund.refund_full_overpayment_ca", true, "Refund any California overpayment."),
  ...Object.entries(OLMIRA_BOXES).map(([tradeId, box]) =>
    dec(makeForm8949BoxDecisionKey(tradeId), box, `The broker reported this sale in ${box}.`),
  ),
];
