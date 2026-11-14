/*
 * TaxCalcBench ty25-ca-001 (README.md): a head of household in Santa Clara
 * County with three sons, one W-2 and unemployment compensation (Form 1099-G),
 * who gets the California earned income tax credit and the young child tax
 * credit (FTB 3514) as a refund. The key is the CA return.
 */

import { lockedGoldenPath } from "../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../types.js";
import { tcbCa001Decisions } from "./decisions.js";
import { tcbCa001Expected } from "./expected.js";
import { TCB_CA_001_TAX_YEAR, TCB_CA_001_USER_ID, tcbCa001Facts } from "./facts.js";

/* The federal forms are inputs to the CA return: evaluated, not checked (the case has no federal key). */
const FORM_IDS = [
  "schedule-1",
  "schedule-8812",
  "form-1040",
  "schedule-ca",
  "form-3514",
  "form-540",
  "form-3532",
];

export const tcbCa001Scenario: Scenario = {
  name: "tcb-ca-001",
  description:
    "HOH Santa Clara County filer with three sons: one W-2 and unemployment on a 1099-G; CA 540 with Schedule CA, FTB 3514 (EITC and young child tax credit) and FTB 3532 (TaxCalcBench).",
  taxYear: TCB_CA_001_TAX_YEAR,
  userId: TCB_CA_001_USER_ID,
  facts: tcbCa001Facts,
  decisions: tcbCa001Decisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: tcbCa001Expected(formId),
    goldenPdfPath: lockedGoldenPath("tcb-ca-001", formId),
  })),
};
