/* The made-up taxpayer's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { OLVER_TAX_YEAR, OLVER_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: OLVER_USER_ID, taxYear: OLVER_TAX_YEAR, key, decision, rationale });

export const olverDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the single threshold."),
  dec("decisions.scope.filing_status", "single", "Not married at the end of 2025."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", false, "No 1099-B."),
  dec("decisions.itemize_vs_standard", "standard", "No itemized deductions."),
  dec("decisions.scope.must_file_ca_540", true, "Full-year California resident."),
  dec("decisions.scope.ca_residency", "full_year", "Lived in Oakland all of 2025."),
  dec("decisions.scope.mailing_same_as_principal_residence", true, "Mailing address is the home."),
  dec("decisions.scope.use_tax_zero_reason", "no_use_tax_owed", "No out-of-state purchases."),
  dec("decisions.refund.refund_full_overpayment_federal", true, "Refund any overpayment."),
  dec("decisions.refund.refund_full_overpayment_ca", true, "Refund any CA overpayment."),
];
