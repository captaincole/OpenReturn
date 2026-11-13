/*
 * TaxCalcBench ty25-ca-004 (README.md): a married couple in San Francisco, both 65
 * or older and blind, with their grandchild: one W-2, bank interest, Social
 * Security and student loan interest (Form 1098-E). The California earned income
 * and young child tax credits (FTB 3514) come back as a refund. The key is the CA
 * return.
 */

import { lockedGoldenPath } from "../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../types.js";
import { tcbCa004Decisions } from "./decisions.js";
import { tcbCa004Expected } from "./expected.js";
import { TCB_CA_004_TAX_YEAR, TCB_CA_004_USER_ID, tcbCa004Facts } from "./facts.js";

/* The federal forms are inputs to the CA return: evaluated, not checked (the case has no federal key). */
const FORM_IDS = [
  "schedule-1",
  "schedule-1-a",
  "schedule-r",
  "schedule-3",
  "schedule-eic",
  "schedule-8812",
  "form-1040",
  "schedule-ca",
  "form-540",
  "form-3514",
];

export const tcbCa004Scenario: Scenario = {
  name: "tcb-ca-004",
  description:
    "MFJ San Francisco filers, both 65+ and blind, with a grandchild: W-2, interest, Social Security, student loan interest (1098-E); CA EITC and young child tax credit on FTB 3514 (TaxCalcBench).",
  taxYear: TCB_CA_004_TAX_YEAR,
  userId: TCB_CA_004_USER_ID,
  facts: tcbCa004Facts,
  decisions: tcbCa004Decisions,
  skip: true,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: tcbCa004Expected(formId),
    goldenPdfPath: lockedGoldenPath("tcb-ca-004", formId),
  })),
};
