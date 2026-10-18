/*
 * Carter Lewis — AI decisions (the "setup").
 *
 * Filing status and scope from the IRS ATS scenario 8 cover page and
 * draft 1040. The California answers were added (docs/RELOCATION.md).
 */

import type { AIDecisionRow } from "../../../src/mastra/db/aiDecisions.js";
import { decisionRow } from "../../helpers/fixtureBuilders.js";
import { CARTER_TAX_YEAR, CARTER_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: CARTER_USER_ID, taxYear: CARTER_TAX_YEAR, key, decision, rationale });

export const carterDecisions: AIDecisionRow[] = [
  dec(
    "decisions.scope.must_file_federal",
    true,
    "Federal income tax was withheld; filing gets it refunded.",
  ),
  dec(
    "decisions.scope.filing_status",
    "married_filing_separately",
    "Married, filing separately from Elizabeth Lewis (draft 1040).",
  ),
  dec("decisions.scope.has_digital_assets", false, "Draft 1040 answers No."),
  dec("decisions.scope.has_reportable_sales", false, "No 1099-B or 1099-DA."),
  dec(
    "decisions.scope.must_file_schedule_d",
    false,
    "Only capital gain distributions, no box 2b–2d amounts: 1040 line 7a Exception 1.",
  ),
  dec(
    "decisions.scope.must_file_ca_540",
    true,
    "Full-year CA resident with income above the filing threshold.",
  ),
  dec("decisions.scope.ca_residency", "full_year", "Lived in Sacramento, CA all of 2025."),
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
