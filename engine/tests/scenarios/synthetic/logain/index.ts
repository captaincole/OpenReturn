/*
 * A made-up single filer in Texas (README.md) who exercised incentive stock
 * options in 2024 and paid AMT: the credit for prior year minimum tax (Form
 * 8801) with Part III, on Schedule 3 line 6b. Federal only. UNVERIFIED: no
 * answer key; the expected values are engine output checked by hand, so a
 * failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { logainDecisions } from "./decisions.js";
import { logainExpected } from "./expected.js";
import { LOGAIN_TAX_YEAR, LOGAIN_USER_ID, logainFacts } from "./facts.js";

const FORM_IDS = [
  "form-8801",
  "form-6251",
  "schedule-3",
  "schedule-b",
  "form-8959",
  "form-8960",
  "schedule-2",
  "form-1040",
];

export const logainScenario: Scenario = {
  name: "logain",
  description:
    "Single TX filer who paid AMT in 2024 on incentive stock options: Form 8801 Parts I–III, the credit on Schedule 3 line 6b and a carryforward to 2026.",
  verification: "unverified",
  taxYear: LOGAIN_TAX_YEAR,
  userId: LOGAIN_USER_ID,
  facts: logainFacts,
  decisions: logainDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: logainExpected(formId),
    goldenPdfPath: lockedGoldenPath("logain", formId),
  })),
};
