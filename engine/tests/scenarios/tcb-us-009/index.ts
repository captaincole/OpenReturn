/*
 * TaxCalcBench ty25-us-009 (README.md): an MFS filer in Florida, born 1951, who
 * lived with the spouse, with a W-2, interest, dividends, two self-rentals and a
 * passive royalty. Federal only.
 */

import type { Scenario } from "../../types.js";
import { tcbUs009Decisions } from "./decisions.js";
import { tcbUs009Expected } from "./expected.js";
import { TCB_US_009_TAX_YEAR, TCB_US_009_USER_ID, tcbUs009Facts } from "./facts.js";

const FORM_IDS = [
  "form-8582",
  "schedule-e",
  "form-8959",
  "form-8960",
  "form-8995",
  "schedule-1",
  "schedule-2",
  "form-1040",
];

export const tcbUs009Scenario: Scenario = {
  name: "tcb-us-009",
  description:
    "MFS FL filer, 65+, lived with the spouse: W-2, self-rental loss and income, a passive royalty (Schedule E, 8582), Form 8995 (TaxCalcBench).",
  taxYear: TCB_US_009_TAX_YEAR,
  userId: TCB_US_009_USER_ID,
  skip: true,
  facts: tcbUs009Facts,
  decisions: tcbUs009Decisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: tcbUs009Expected(formId),
  })),
};
