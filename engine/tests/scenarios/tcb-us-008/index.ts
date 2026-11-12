/*
 * TaxCalcBench ty25-us-008 (README.md): an MFS filer in Florida with a W-2, a
 * consulting business paid on a 1099-NEC, itemized deductions and a capital
 * loss carryover. Federal only.
 */

import type { Scenario } from "../../types.js";
import { tcbUs008Decisions } from "./decisions.js";
import { tcbUs008Expected } from "./expected.js";
import { TCB_US_008_TAX_YEAR, TCB_US_008_USER_ID, tcbUs008Facts } from "./facts.js";

const FORM_IDS = [
  "schedule-d",
  "schedule-c",
  "schedule-se",
  "form-8959",
  "form-8960",
  "form-8995",
  "schedule-a",
  "schedule-1",
  "schedule-2",
  "form-1040",
];

export const tcbUs008Scenario: Scenario = {
  name: "tcb-us-008",
  description:
    "MFS FL filer: W-2, 1099-NEC consulting Schedule C (mileage, home office), itemized gifts, capital loss carryover, Form 8995 (TaxCalcBench).",
  taxYear: TCB_US_008_TAX_YEAR,
  userId: TCB_US_008_USER_ID,
  facts: tcbUs008Facts,
  decisions: tcbUs008Decisions,
  skip: true,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: tcbUs008Expected(formId),
  })),
};
