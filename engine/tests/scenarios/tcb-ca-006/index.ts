/*
 * TaxCalcBench ty25-ca-006 (README.md): a married couple in Sacramento County,
 * each with one W-2, who owe $12 of California use tax and take the standard
 * deduction. The key is the CA return.
 */

import { lockedGoldenPath } from "../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../types.js";
import { tcbCa006Decisions } from "./decisions.js";
import { tcbCa006Expected } from "./expected.js";
import { TCB_CA_006_TAX_YEAR, TCB_CA_006_USER_ID, tcbCa006Facts } from "./facts.js";

/* The federal Form 1040 is an input to the CA return (line 13): evaluated, not checked. */
const FORM_IDS = ["form-1040", "form-540"];

export const tcbCa006Scenario: Scenario = {
  name: "tcb-ca-006",
  description:
    "MFJ Sacramento County filers: two W-2s, standard deduction, $12 of CA use tax, CA refund (TaxCalcBench).",
  taxYear: TCB_CA_006_TAX_YEAR,
  userId: TCB_CA_006_USER_ID,
  facts: tcbCa006Facts,
  decisions: tcbCa006Decisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: tcbCa006Expected(formId),
    goldenPdfPath: lockedGoldenPath("tcb-ca-006", formId),
  })),
};
