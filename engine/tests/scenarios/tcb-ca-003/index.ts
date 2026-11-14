/*
 * TaxCalcBench ty25-ca-003 (README.md): a married couple filing jointly in San
 * Francisco County with two sons, two W-2s with dependent care benefits, a tax
 * preparation business with a loss and $5,000 of daycare. The California
 * earned income tax credit (FTB 3514) comes back as a refund. The key is the
 * CA return.
 */

import { lockedGoldenPath } from "../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../types.js";
import { tcbCa003Decisions } from "./decisions.js";
import { tcbCa003Expected } from "./expected.js";
import { TCB_CA_003_TAX_YEAR, TCB_CA_003_USER_ID, tcbCa003Facts } from "./facts.js";

/* The federal forms are inputs to the CA return: evaluated, not checked (the case has no federal key). */
const FORM_IDS = [
  "schedule-c",
  "schedule-1",
  "form-8995",
  "form-2441",
  "schedule-3",
  "schedule-8812",
  "schedule-eic",
  "form-1040",
  "form-3514",
  "form-540",
];

export const tcbCa003Scenario: Scenario = {
  name: "tcb-ca-003",
  description:
    "MFJ San Francisco County couple with two sons: two W-2s with dependent care benefits (Form 2441 Part III), a Schedule C loss, the federal EIC and the California EITC on FTB 3514 (TaxCalcBench).",
  taxYear: TCB_CA_003_TAX_YEAR,
  userId: TCB_CA_003_USER_ID,
  facts: tcbCa003Facts,
  decisions: tcbCa003Decisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: tcbCa003Expected(formId),
    goldenPdfPath: lockedGoldenPath("tcb-ca-003", formId),
  })),
};
