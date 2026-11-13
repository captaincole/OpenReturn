/* Source: TaxCalcBench ty25-ca-001 answers (input/remaining_data.json) and the answer key. */

import type { AIDecisionRow } from "../../../src/facts/rows.js";
import { decisionRow } from "../../helpers/fixtureBuilders.js";
import { TCB_CA_001_TAX_YEAR, TCB_CA_001_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({
    userId: TCB_CA_001_USER_ID,
    taxYear: TCB_CA_001_TAX_YEAR,
    key,
    decision,
    rationale,
  });

export const tcbCa001Decisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Federal tax was withheld; the return claims it."),
  dec(
    "decisions.scope.filing_status",
    "head_of_household",
    "Answers: head_of_household; not married, with her three sons in the home all year.",
  ),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity in the answers."),
  dec(
    "decisions.scope.has_foreign_financial_account",
    false,
    "Answers: no financial accounts outside the U.S.",
  ),
  dec("decisions.scope.has_foreign_trust", false, "Answers: no foreign trust."),
  dec(
    "decisions.itemize_vs_standard",
    "standard",
    "Answers: no itemized deductions; the key takes the CA standard deduction ($11,412).",
  ),
  dec("decisions.scope.must_file_ca_540", true, "Full-year Santa Clara County resident."),
  dec("decisions.scope.ca_residency", "full_year", "Answers: lived in one state all of 2025."),
  dec(
    "decisions.scope.must_file_schedule_ca",
    true,
    "California does not tax the unemployment compensation (Schedule CA line 7).",
  ),
  dec(
    "decisions.scope.mailing_same_as_principal_residence",
    true,
    "Answers: ca_form540.same_address.",
  ),
  dec(
    "decisions.scope.use_tax_zero_reason",
    "no_use_tax_owed",
    "Answers: use_tax 0, subject_to_use_tax false.",
  ),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Answers: refund by direct deposit, nothing applied to 2026.",
  ),
  dec(
    "decisions.refund.refund_full_overpayment_ca",
    true,
    "Answers: nothing applied to 2026 estimated tax.",
  ),
];
