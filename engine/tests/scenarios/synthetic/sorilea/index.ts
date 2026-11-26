/*
 * A made-up single filer in Washington (README.md), built on Example 1 of the
 * Form 8606 line 15b instructions: a traditional IRA with basis, one
 * distribution unrelated to the disaster and one qualified disaster
 * distribution. Form 8606 line 15b, Form 8915-F lines 17 Yes and 18, Form 1040
 * line 4b from Form 8606 line 15c and Form 8915-F line 26. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { sorileaDecisions } from "./decisions.js";
import { sorileaExpected } from "./expected.js";
import { SORILEA_TAX_YEAR, SORILEA_USER_ID, sorileaFacts } from "./facts.js";

const FORM_IDS = ["form-8915-f", "form-8606", "form-1040"];

export const sorileaScenario: Scenario = {
  name: "sorilea",
  description:
    "Single WA filer, a 2025 disaster: a traditional IRA with basis, a $22,000 qualified disaster distribution and an $11,000 other one (Form 8606 line 15b, Form 8915-F lines 17 and 18, Form 1040 line 4b).",
  verification: "unverified",
  taxYear: SORILEA_TAX_YEAR,
  userId: SORILEA_USER_ID,
  facts: sorileaFacts,
  decisions: sorileaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: sorileaExpected(formId),
    goldenPdfPath: lockedGoldenPath("sorilea", formId),
  })),
};
