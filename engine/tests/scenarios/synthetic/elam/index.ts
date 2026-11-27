/*
 * A made-up single filer in Reno, Nevada (README.md): a climbing gym
 * (Schedule C) that made its entrance and classes accessible, and a K-1 code K.
 * Form 8826 lines 1 to 8, Schedule C lines 11 and 21 less the credit, Form
 * 3800 line 1e with two sources, Schedule 3 line 6a. UNVERIFIED: no answer
 * key; the expected values are engine output checked by hand, so a failure
 * means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { elamDecisions } from "./decisions.js";
import { elamExpected } from "./expected.js";
import { ELAM_TAX_YEAR, ELAM_USER_ID, elamFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
export const FORM_IDS = [
  "form-8826",
  "schedule-c",
  "schedule-se",
  "schedule-e",
  "schedule-1",
  "form-8995",
  "form-6251",
  "form-3800",
  "schedule-2",
  "schedule-3",
  "form-1040",
];

export const elamScenario: Scenario = {
  name: "elam",
  description:
    "Single NV climbing gym owner with disabled access expenditures and a K-1 code K: Form 8826 lines 1 to 8, Schedule C lines 11 and 21 less the credit, Form 3800 line 1e, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: ELAM_TAX_YEAR,
  userId: ELAM_USER_ID,
  facts: elamFacts,
  decisions: elamDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: elamExpected(formId),
    goldenPdfPath: lockedGoldenPath("elam", formId),
  })),
};
