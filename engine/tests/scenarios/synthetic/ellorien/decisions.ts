/* The made-up parent's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { ELLORIEN_TAX_YEAR, ELLORIEN_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: ELLORIEN_USER_ID, taxYear: ELLORIEN_TAX_YEAR, key, decision, rationale });

export const ellorienDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the filing threshold."),
  dec(
    "decisions.scope.filing_status",
    "head_of_household",
    "Divorced; Mira and Senna lived with her all year and she paid the home's costs.",
  ),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", false, "No 1099-B or 1099-DA."),
  dec("decisions.itemize_vs_standard", "standard", "No itemized deductions."),
  dec("decisions.scope.must_file_ca_540", false, "Full-year Nevada resident."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived in Henderson, NV all of 2025."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Refund the whole overpayment; none applied to 2026.",
  ),
];
