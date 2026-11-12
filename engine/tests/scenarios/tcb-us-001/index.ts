/*
 * TaxCalcBench ty25-us-001 (README.md): a head of household in Alaska with a large
 * W-2, a $5,000,000 long-term gain, itemized deductions with investment interest
 * (Form 4952) and an incentive stock option exercise (Form 6251). Federal only.
 */

import type { Scenario } from "../../types.js";
import { tcbUs001Decisions } from "./decisions.js";
import { tcbUs001Expected } from "./expected.js";
import { TCB_US_001_TAX_YEAR, TCB_US_001_USER_ID, tcbUs001Facts } from "./facts.js";

const FORM_IDS = [
  "form-8949",
  "schedule-d",
  "form-8959",
  "form-8960",
  "form-4952",
  "schedule-a",
  "form-6251",
  "schedule-2",
  "form-1040",
];

export const tcbUs001Scenario: Scenario = {
  name: "tcb-us-001",
  description:
    "HOH Alaska filer: a large W-2, a 1099-B long-term gain, Form 1098, investment interest, ISO exercise with federal AMT (TaxCalcBench).",
  taxYear: TCB_US_001_TAX_YEAR,
  userId: TCB_US_001_USER_ID,
  facts: tcbUs001Facts,
  decisions: tcbUs001Decisions,
  skip: true,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: tcbUs001Expected(formId),
  })),
};
