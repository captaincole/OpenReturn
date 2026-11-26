/* The made-up taxpayer's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { BAIR_TAX_YEAR, BAIR_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: BAIR_USER_ID, taxYear: BAIR_TAX_YEAR, key, decision, rationale });

export const bairDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the filing threshold."),
  dec(
    "decisions.scope.filing_status",
    "head_of_household",
    "Unmarried; his grandson lived with him all year and he paid the home's costs.",
  ),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", false, "No 1099-B or 1099-DA."),
  dec("decisions.itemize_vs_standard", "standard", "No itemized deductions."),
  dec(
    "decisions.scope.has_foreign_financial_account",
    false,
    "His pay goes to his U.S. bank account; he holds no account abroad.",
  ),
  dec("decisions.scope.has_foreign_trust", false, "No foreign trust."),
  dec("decisions.scope.must_file_ca_540", false, "Domiciled in Florida; abroad all year."),
  dec("decisions.scope.ca_residency", "non_resident", "Not a California resident."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Refund the whole overpayment; none applied to 2026.",
  ),
];
