/*
 * Tara Black — AI decisions (the "setup").
 *
 * Filing status and scope from the IRS ATS scenario 1 draft 1040. The
 * California answers were added (docs/RELOCATION.md).
 */

import type { AIDecisionRow } from "../../../src/engine/facts/rows.js";
import { decisionRow } from "../../helpers/fixtureBuilders.js";
import { TARA_TAX_YEAR, TARA_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: TARA_USER_ID, taxYear: TARA_TAX_YEAR, key, decision, rationale });

export const taraDecisions: AIDecisionRow[] = [
  dec(
    "decisions.scope.must_file_federal",
    true,
    "Single, under 65: gross income ($42,470) is over the $15,750 filing threshold. Household employment taxes also require a return.",
  ),
  dec("decisions.scope.filing_status", "single", "Single (IRS draft 1040)."),
  dec("decisions.scope.has_digital_assets", false, "Draft 1040 answers No."),
  dec("decisions.scope.has_reportable_sales", false, "No 1099-B or 1099-DA."),
  dec(
    "decisions.scope.must_file_ca_540",
    true,
    "Full-year CA resident with CA gross income over the single filing threshold.",
  ),
  dec("decisions.scope.ca_residency", "full_year", "Lived in San Jose, CA all of 2025."),
  dec(
    "decisions.scope.mailing_same_as_principal_residence",
    true,
    "Mailing address is the home address.",
  ),
  dec(
    "decisions.scope.use_tax_zero_reason",
    "no_use_tax_owed",
    "No out-of-state purchases requiring use tax.",
  ),
  dec(
    "decisions.refund.refund_full_overpayment_federal",
    true,
    "Default: refund any federal overpayment.",
  ),
  dec("decisions.refund.refund_full_overpayment_ca", true, "Default: refund any CA overpayment."),
];
