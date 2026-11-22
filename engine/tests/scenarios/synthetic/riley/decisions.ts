/* Riley's answers (made up, README.md). */

import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { RILEY_TAX_YEAR, RILEY_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: RILEY_USER_ID, taxYear: RILEY_TAX_YEAR, key, decision, rationale });

export const rileyDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "Gross income is over the single threshold."),
  dec("decisions.scope.filing_status", "single", "Riley is unmarried, with no dependents."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity in 2025."),
  dec("decisions.scope.has_reportable_sales", false, "No 1099-B or 1099-DA."),
  dec("decisions.scope.must_file_ca_540", false, "Full-year Nevada resident."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived in Reno, Nevada all of 2025."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Default: refund any federal overpayment.",
  ),
];
