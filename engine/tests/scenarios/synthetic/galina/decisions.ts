/* The made-up farmer's answers (README.md). */

import { makeForm8949BoxDecisionKey } from "../../../../src/facts/index.js";
import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import {
  COOP_SALE_ID,
  GALINA_TAX_YEAR,
  GALINA_USER_ID,
  LONG_SALE_ID,
  SHORT_SALE_ID,
} from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: GALINA_USER_ID, taxYear: GALINA_TAX_YEAR, key, decision, rationale });

export const galinaDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "She has wages and self-employment activity."),
  dec("decisions.scope.filing_status", "single", "Unmarried all of 2025."),
  dec("decisions.scope.has_digital_assets", false, "No digital asset activity."),
  dec("decisions.scope.has_reportable_sales", true, "Three sales: two on a 1099-B, one with none."),
  dec(
    makeForm8949BoxDecisionKey(SHORT_SALE_ID),
    "partI.boxA",
    "1099-B, short-term, basis reported.",
  ),
  dec(
    makeForm8949BoxDecisionKey(LONG_SALE_ID),
    "partII.boxD",
    "1099-B, long-term, basis reported.",
  ),
  dec(makeForm8949BoxDecisionKey(COOP_SALE_ID), "partII.boxF", "No 1099-B; held over a year."),
  dec("decisions.itemize_vs_standard", "standard", "No itemized deductions above the standard."),
  dec("decisions.scope.must_file_ca_540", false, "Full-year South Dakota resident."),
  dec("decisions.scope.ca_residency", "non_resident", "Lived in Brookings, SD all of 2025."),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Refund the whole overpayment; none applied to 2026.",
  ),
];
