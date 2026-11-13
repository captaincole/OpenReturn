/* Source: TaxCalcBench ty25-us-007 answers (input/remaining_data.json) and the answer key. */

import { makeForm8949BoxDecisionKey } from "../../../src/facts/index.js";
import type { AIDecisionRow } from "../../../src/facts/rows.js";
import { decisionRow } from "../../helpers/fixtureBuilders.js";
import { ABC_TRADE_ID, INTUIT_TRADE_ID, TCB_US_007_TAX_YEAR, TCB_US_007_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({
    userId: TCB_US_007_USER_ID,
    taxYear: TCB_US_007_TAX_YEAR,
    key,
    decision,
    rationale,
  });

export const tcbUs007Decisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the MFS filing threshold."),
  dec("decisions.scope.filing_status", "married_filing_separately", "Answers: married_separately."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity in the answers."),
  dec("decisions.scope.has_reportable_sales", true, "Two Etrade 1099-Bs report one sale each."),
  dec("decisions.scope.must_file_schedule_d", true, "Two sales and a short-term loss carryover."),
  dec(
    "decisions.scope.must_file_8949",
    true,
    "The sales are itemized on Form 8949 (boxes A and D).",
  ),
  dec(
    makeForm8949BoxDecisionKey(INTUIT_TRADE_ID),
    "partII.boxD",
    "The 1099-B checks box D: long-term, basis reported to the IRS.",
  ),
  dec(
    makeForm8949BoxDecisionKey(ABC_TRADE_ID),
    "partI.boxA",
    "Bought 07/05/2025 and sold 11/28/2025: held one year or less, so short-term. The 1099-B checks long-term and box D; the dates decide, and the key reports it in box A.",
  ),
  dec(
    "decisions.itemize_vs_standard",
    "standard",
    "Answers: standard; mortgage interest ($8,059) and state tax ($6,794) are under the $15,750 MFS standard deduction.",
  ),
  dec("decisions.scope.must_file_ca_540", false, "Full-year Tennessee resident."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived in Knoxville, TN all of 2025."),
];
