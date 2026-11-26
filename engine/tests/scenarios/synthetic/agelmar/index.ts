/*
 * A made-up single filer in Florida (README.md): two 2024 storms, a 401(k) and
 * a traditional IRA qualified disaster distribution above the limit, a 401(k)
 * hardship distribution for a house the storm kept from being built, income
 * and an excess repayment from the 2024 Form 8915-F. Form 8915-F Parts I to IV,
 * Form 5329 and Schedule 2 line 8, Form 1040 lines 4b and 5b. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { agelmarDecisions } from "./decisions.js";
import { agelmarExpected } from "./expected.js";
import { AGELMAR_TAX_YEAR, AGELMAR_USER_ID, agelmarFacts } from "./facts.js";

const FORM_IDS = ["form-8915-f", "form-5329", "schedule-2", "form-1040"];

export const agelmarScenario: Scenario = {
  name: "agelmar",
  description:
    "Single FL filer, 2024 disasters: 401(k) and IRA qualified disaster distributions over the limit, a Part IV hardship distribution partly repaid, spread income and an excess repayment from 2024 (Form 8915-F, Form 5329, Form 1040 lines 4b and 5b).",
  verification: "unverified",
  taxYear: AGELMAR_TAX_YEAR,
  userId: AGELMAR_USER_ID,
  facts: agelmarFacts,
  decisions: agelmarDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: agelmarExpected(formId),
    goldenPdfPath: lockedGoldenPath("agelmar", formId),
  })),
};
