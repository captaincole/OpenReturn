/* Source: TaxCalcBench ty25-ca-006 answers (input/remaining_data.json) and the answer key. */

import type { AIDecisionRow } from "../../../src/facts/rows.js";
import { decisionRow } from "../../helpers/fixtureBuilders.js";
import { TCB_CA_006_TAX_YEAR, TCB_CA_006_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({
    userId: TCB_CA_006_USER_ID,
    taxYear: TCB_CA_006_TAX_YEAR,
    key,
    decision,
    rationale,
  });

export const tcbCa006Decisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the MFJ filing threshold."),
  dec("decisions.scope.filing_status", "married_filing_jointly", "Answers: married_jointly."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity in the answers."),
  dec("decisions.scope.has_reportable_sales", false, "No 1099-B or other sale in the inputs."),
  dec("decisions.scope.must_file_schedule_d", false, "No capital gain or loss."),
  dec("decisions.scope.must_file_8949", false, "No sale to itemize."),
  dec(
    "decisions.itemize_vs_standard",
    "standard",
    "The answers give no itemized deductions; both returns take the standard deduction.",
  ),
  dec(
    "decisions.scope.must_file_ca_540",
    true,
    "Full-year Sacramento County residents with CA wages.",
  ),
  dec("decisions.scope.ca_residency", "full_year", "Answers: lived in one state (CA) all of 2025."),
  dec(
    "decisions.scope.must_file_schedule_ca",
    false,
    "W-2 wages only, and CA conforms on each: the key has no Schedule CA.",
  ),
  dec(
    "decisions.scope.mailing_same_as_principal_residence",
    true,
    "Answers: ca_form540.same_address.",
  ),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Answers: refund by direct deposit, nothing applied to 2026.",
  ),
  dec(
    "decisions.refund.refund_full_overpayment_ca",
    true,
    "The key refunds the whole CA overpayment (line 115 = line 99).",
  ),
];
