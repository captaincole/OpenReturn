/* Source: TaxCalcBench ty25-us-002 answers (input/remaining_data.json) and the answer key. */

import type { AIDecisionRow } from "../../../src/facts/rows.js";
import { decisionRow } from "../../helpers/fixtureBuilders.js";
import { TCB_US_002_TAX_YEAR, TCB_US_002_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({
    userId: TCB_US_002_USER_ID,
    taxYear: TCB_US_002_TAX_YEAR,
    key,
    decision,
    rationale,
  });

export const tcbUs002Decisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the HOH filing threshold."),
  dec(
    "decisions.scope.filing_status",
    "head_of_household",
    "Answers: head_of_household; unmarried, paid over half the cost of a home for the nephew all year.",
  ),
  dec("decisions.scope.has_digital_assets", false, "Key: VirtualCurAcquiredDurTYInd false."),
  dec(
    "decisions.itemize_vs_standard",
    "standard",
    "Answers: maximize_deduction. The standard deduction raised by the $2,500 net qualified disaster loss ($26,125) beats itemizing.",
  ),
  dec(
    "decisions.scope.must_file_4952",
    true,
    "$4,000 of investment interest with no investment income: the whole amount carries forward on line 7.",
  ),
  dec("decisions.scope.must_file_ca_540", false, "Full-year Alaska resident."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived in Alaska all of 2025."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Answers: refund by direct deposit, nothing applied to 2026.",
  ),
];
