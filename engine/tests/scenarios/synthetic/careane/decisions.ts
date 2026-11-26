/* The made-up filer's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { CAREANE_TAX_YEAR, CAREANE_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: CAREANE_USER_ID, taxYear: CAREANE_TAX_YEAR, key, decision, rationale });

export const careaneDecisions: AIDecisionRow[] = [
  dec(
    "decisions.scope.must_file_federal",
    true,
    "Gross income is over the separate-return threshold.",
  ),
  dec(
    "decisions.scope.filing_status",
    "married_filing_separately",
    "Married all of 2025 to Davram, filing separately.",
  ),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", true, "One 1099-B sale of inherited shares."),
  dec("decisions.scope.has_foreign_financial_account", false, "No foreign accounts."),
  dec("decisions.scope.has_foreign_trust", false, "No foreign trust."),
  dec("decisions.itemize_vs_standard", "standard", "Neither spouse itemizes."),
  dec("decisions.scope.must_file_ca_540", false, "Full-year Texas residents."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived in El Paso, TX all of 2025."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Refund the whole overpayment; none applied to 2026.",
  ),
];
