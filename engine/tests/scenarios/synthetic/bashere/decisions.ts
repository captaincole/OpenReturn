/* The made-up filer's answers (README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { BASHERE_TAX_YEAR, BASHERE_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: BASHERE_USER_ID, taxYear: BASHERE_TAX_YEAR, key, decision, rationale });

export const bashereDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Self-employment earnings of $400 or more."),
  dec("decisions.scope.filing_status", "single", "Not married at the end of 2025."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", false, "No sales of stock or other property."),
  dec("decisions.scope.must_file_schedule_a", true, "Itemizes on Schedule A."),
  dec(
    "decisions.itemize_vs_standard",
    "itemized",
    "Mortgage interest and real estate tax are more than the standard deduction.",
  ),
  dec("decisions.scope.must_file_8606", false, "No nondeductible IRA contributions, ever."),
  dec("decisions.scope.must_file_ca_540", false, "Full-year Texas resident."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived in San Antonio, TX all of 2025."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Refund any overpayment; none applied to 2026.",
  ),
];
