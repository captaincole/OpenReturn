/* The made-up taxpayer's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { KIRUNA_TAX_YEAR, KIRUNA_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: KIRUNA_USER_ID, taxYear: KIRUNA_TAX_YEAR, key, decision, rationale });

export const kirunaDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the single threshold."),
  dec("decisions.scope.filing_status", "single", "Not married at the end of 2025."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", false, "No 1099-B."),
  dec("decisions.itemize_vs_standard", "standard", "No itemized deductions."),
  dec("decisions.scope.must_file_ca_540", true, "Full-year California resident."),
  dec("decisions.scope.ca_residency", "full_year", "Lived in San Jose all of 2025."),
  /*
   * "Attach it to Form 540 only if any one of the following apply: ... You
   * have more than two credits" (ca-540-sched-p-inst-2025::sec::b-who-must-file::b01):
   * the research, orphan drug and low-income housing credits.
   */
  dec("decisions.scope.must_file_schedule_p", true, "More than two credits (Schedule P (540))."),
  dec("decisions.scope.mailing_same_as_principal_residence", true, "Mailing address is the home."),
  dec("decisions.scope.use_tax_zero_reason", "no_use_tax_owed", "No out-of-state purchases."),
  dec("decisions.refund.refund_full_overpayment_federal", true, "Refund any overpayment."),
  dec("decisions.refund.refund_full_overpayment_ca", true, "Refund any CA overpayment."),
];
