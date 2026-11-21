import { makeForm8949BoxDecisionKey } from "../../../../src/facts/index.js";
import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { ROSALIND_BOXES, ROSALIND_TAX_YEAR, ROSALIND_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: ROSALIND_USER_ID, taxYear: ROSALIND_TAX_YEAR, key, decision, rationale });

export const rosalindDecisions: AIDecisionRow[] = [
  dec("decisions.scope.must_file_federal", true, "W-2 wages exceed the filing threshold."),
  dec("decisions.scope.filing_status", "single", "Rosalind stated single filing status."),
  dec("decisions.scope.has_reportable_sales", true, "The 1099-B reports three sales."),
  dec("decisions.scope.has_digital_assets", false, "Rosalind stated no digital assets."),
  dec(
    "decisions.scope.must_file_ca_540",
    true,
    "Full-year California resident with income above the filing threshold.",
  ),
  dec("decisions.scope.ca_residency", "full_year", "Rosalind lived in Sacramento all of 2025."),
  dec(
    "decisions.scope.mailing_same_as_principal_residence",
    true,
    "Mailing address is the principal residence.",
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
  ...Object.entries(ROSALIND_BOXES).map(([tradeId, box]) =>
    dec(makeForm8949BoxDecisionKey(tradeId), box, `The broker reported this sale in ${box}.`),
  ),
];
