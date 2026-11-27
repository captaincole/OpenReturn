/*
 * A made-up single taxpayer who lives in American Samoa (README.md): every
 * line of Form 4563 Part II, the shared standard deduction on Form 1040 line
 * 12e, and Form 4563 line 15 added back on Schedule 1-A line 2d, Schedule
 * 8812 line 2c, the Pub. 970 student loan worksheet and the Pub. 915 social
 * security worksheet. Federal only. UNVERIFIED: no answer key; the expected
 * values are engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { beryllaDecisions } from "./decisions.js";
import { beryllaExpected } from "./expected.js";
import { BERYLLA_TAX_YEAR, BERYLLA_USER_ID, beryllaFacts } from "./facts.js";

const FORM_IDS = ["form-4563", "schedule-1", "schedule-1-a", "schedule-8812", "form-1040"];

export const beryllaScenario: Scenario = {
  name: "berylla",
  description:
    "Single AS resident: Form 4563 with every Part II line, the shared standard deduction, and line 15 added back to MAGI (Schedule 1-A, Schedule 8812, student loan interest, taxable social security).",
  verification: "unverified",
  taxYear: BERYLLA_TAX_YEAR,
  userId: BERYLLA_USER_ID,
  facts: beryllaFacts,
  decisions: beryllaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: beryllaExpected(formId),
    goldenPdfPath: lockedGoldenPath("berylla", formId),
  })),
};
