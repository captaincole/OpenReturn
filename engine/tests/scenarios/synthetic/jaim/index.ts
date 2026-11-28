/*
 * A made-up single landscaping company owner in Texas (README.md): fourteen
 * employees on Schedule C, eight enrolled in SHOP health plans, and a Schedule
 * K-1 (Form 1065) from a nursery partnership with the same credit in box 15
 * code BA. Form 8941 lines A to 16 with both phaseouts (12 FTEs, $37,000 of
 * average wages), Schedule C line 14 reduced by line 12, Form 3800 line 4h and
 * Schedule 3 line 6a. Federal only. UNVERIFIED: no answer key; the expected
 * values are engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { jaimDecisions } from "./decisions.js";
import { jaimExpected } from "./expected.js";
import { JAIM_TAX_YEAR, JAIM_USER_ID, jaimFacts } from "./facts.js";

const FORM_IDS = [
  "form-8941",
  "form-3800",
  "schedule-c",
  "schedule-se",
  "schedule-e",
  "form-8995-a",
  "form-8959",
  "schedule-1",
  "schedule-2",
  "schedule-3",
  "form-1040",
];

export const jaimScenario: Scenario = {
  name: "jaim",
  description:
    "Single TX landscaping company owner: 14 employees (12 FTEs, $37,000 average wages, one seasonal), SHOP premiums above the county average, a state subsidy and a K-1 (Form 1065) code BA; Form 8941 lines A to 16 with both phaseouts, Schedule C line 14 reduced by line 12, Form 3800 line 4h, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: JAIM_TAX_YEAR,
  userId: JAIM_USER_ID,
  facts: jaimFacts,
  decisions: jaimDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: jaimExpected(formId),
    goldenPdfPath: lockedGoldenPath("jaim", formId),
  })),
};
