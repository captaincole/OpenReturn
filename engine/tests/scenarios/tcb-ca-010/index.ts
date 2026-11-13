/*
 * TaxCalcBench ty25-ca-010 (README.md): a single filer in Lake County, born
 * 2003, with one $13,000 W-2 and no California tax after the exemption credit,
 * who gets the California earned income tax credit (FTB 3514) as a refund. The
 * key is the CA return.
 */

import { lockedGoldenPath } from "../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../types.js";
import { tcbCa010Decisions } from "./decisions.js";
import { tcbCa010Expected } from "./expected.js";
import { TCB_CA_010_TAX_YEAR, TCB_CA_010_USER_ID, tcbCa010Facts } from "./facts.js";

/* Form 1040 is an input to the CA return: evaluated, not checked (the case has no federal key). */
const FORM_IDS = ["form-1040", "form-3514", "form-540"];

export const tcbCa010Scenario: Scenario = {
  name: "tcb-ca-010",
  description:
    "Single Lake County filer, age 22: one W-2, the California earned income tax credit on FTB 3514 with no qualifying child (TaxCalcBench).",
  taxYear: TCB_CA_010_TAX_YEAR,
  userId: TCB_CA_010_USER_ID,
  facts: tcbCa010Facts,
  decisions: tcbCa010Decisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: tcbCa010Expected(formId),
    goldenPdfPath: lockedGoldenPath("tcb-ca-010", formId),
  })),
};
