/* The made-up taxpayer's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { ROMANDA_TAX_YEAR, ROMANDA_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: ROMANDA_USER_ID, taxYear: ROMANDA_TAX_YEAR, key, decision, rationale });

export const romandaDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Self-employment earnings of $400 or more."),
  dec("decisions.scope.filing_status", "single", "Not married."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", false, "No 1099-B or 1099-DA."),
  dec("decisions.itemize_vs_standard", "standard", "No itemized deductions."),
  dec("decisions.scope.must_file_8606", false, "No nondeductible IRA contributions, ever."),
  dec(
    "decisions.scope.has_foreign_financial_account",
    false,
    "Her clients pay into her U.S. account; she holds no account abroad.",
  ),
  dec("decisions.scope.has_foreign_trust", false, "No foreign trust."),
  dec(
    "decisions.scope.must_file_ca_540",
    true,
    "Full-year California resident: abroad on a temporary 12-month contract, home kept in San Luis Obispo.",
  ),
  dec(
    "decisions.scope.ca_residency",
    "full_year",
    "California is her home; the absence is temporary.",
  ),
  dec("decisions.scope.mailing_same_as_principal_residence", true, "Mailing address is the home."),
  dec("decisions.scope.use_tax_zero_reason", "no_use_tax_owed", "No out-of-state purchases."),
  dec("decisions.refund.refund_full_overpayment_federal", true, "Refund any overpayment."),
  dec("decisions.refund.refund_full_overpayment_ca", true, "Refund any CA overpayment."),
];
