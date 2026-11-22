/* Synthetic: the Morgans' answers are made up (README.md). */

import { makeForm8949BoxDecisionKey } from "../../../../src/facts/index.js";
import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { BROKER_TRADE_ID, MORGAN_TAX_YEAR, MORGAN_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: MORGAN_USER_ID, taxYear: MORGAN_TAX_YEAR, key, decision, rationale });

export const morganDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the MFJ filing threshold."),
  dec("decisions.scope.filing_status", "married_filing_jointly", "Married, filing jointly."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", true, "The 1099-B reports one sale."),
  dec("decisions.scope.must_file_schedule_d", true, "A long-term capital gain from the 1099-B."),
  dec("decisions.scope.must_file_8949", true, "The sale is itemized on Form 8949 (box D)."),
  dec(
    makeForm8949BoxDecisionKey(BROKER_TRADE_ID),
    "partII.boxD",
    "The 1099-B checks box D: long-term, basis reported to the IRS.",
  ),
  dec(
    "decisions.scope.must_file_8814",
    true,
    "The parents elect to report Ellis's and Wren's interest and dividends on their joint return.",
  ),
  dec("decisions.scope.has_foreign_financial_account", false, "No foreign accounts."),
  dec("decisions.scope.has_foreign_trust", false, "No foreign trust."),
  dec(
    "decisions.itemize_vs_standard",
    "standard",
    "No itemized deductions near the $31,500 standard deduction.",
  ),
  dec("decisions.scope.must_file_ca_540", false, "Full-year Texas residents."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived in Round Rock, TX all of 2025."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Default: refund any federal overpayment.",
  ),
];
