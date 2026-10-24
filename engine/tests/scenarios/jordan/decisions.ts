/*
 * Jordan A. Sample — AI decisions (the "setup").
 *
 * Scope decisions mirror alejandro/decisions.ts. Each sale also carries
 * its broker-reported Form 8949 box decision, as ingest writes it.
 */

import { makeForm8949BoxDecisionKey } from "../../../src/facts/index.js";
import type { AIDecisionRow } from "../../../src/facts/rows.js";
import { decisionRow } from "../../helpers/fixtureBuilders.js";
import { JORDAN_BOXES, JORDAN_TAX_YEAR, JORDAN_USER_ID } from "./facts.js";

const dec = (key: string, decision: unknown, rationale: string) =>
  decisionRow({ userId: JORDAN_USER_ID, taxYear: JORDAN_TAX_YEAR, key, decision, rationale });

export const jordanDecisions: AIDecisionRow[] = [
  dec(
    "decisions.scope.must_file_federal",
    true,
    "W-2 wages far exceed the single-filer filing threshold.",
  ),
  dec("decisions.scope.filing_status", "single", "Jordan stated single filing status."),
  dec("decisions.scope.has_reportable_sales", true, "1099-B and 1099-DA report sales."),
  dec(
    "decisions.scope.has_digital_assets",
    true,
    "1099-DA reports digital asset sales, so the 1040 digital asset question is Yes.",
  ),
  dec(
    "decisions.scope.has_foreign_financial_account",
    false,
    "Jordan stated no foreign financial accounts (Schedule B line 7a).",
  ),
  dec(
    "decisions.scope.has_foreign_trust",
    false,
    "Jordan stated no foreign trust distributions or grantor trusts (Schedule B line 8).",
  ),
  dec(
    "decisions.scope.must_file_schedule_d",
    true,
    "Capital gains and losses from 1099-B and 1099-DA sales.",
  ),
  dec(
    "decisions.scope.must_file_8949",
    true,
    "Sales in boxes B, D, E and H are itemized on Form 8949.",
  ),
  dec(
    "decisions.scope.must_file_schedule_ca",
    true,
    "HSA employer contributions are a CA addition (column C).",
  ),
  dec(
    "decisions.scope.must_file_ca_540",
    true,
    "Full-year CA resident with income above the filing threshold.",
  ),
  dec("decisions.scope.ca_residency", "full_year", "Jordan lived in Oakland, CA all of 2025."),
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
  ...Object.entries(JORDAN_BOXES).map(([tradeId, box]) =>
    dec(makeForm8949BoxDecisionKey(tradeId), box, `Broker reported this sale in Form 8949 ${box}.`),
  ),
];
