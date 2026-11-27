/*
 * A made-up single filer in Fresno, California (README.md): a cleaning company
 * (Schedule C) with 2024 gross receipts above $1 million and 24 full-time
 * employees that made its office restroom accessible. Form 8826 lines 1 to 8,
 * Schedule C line 21 less the credit, Form 3800 line 1e, Schedule 3 line 6a,
 * and Schedule CA line 3 column B, which adds the reduced expense back.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { flannDecisions } from "./decisions.js";
import { flannExpected } from "./expected.js";
import { FLANN_TAX_YEAR, FLANN_USER_ID, flannFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
export const FORM_IDS = [
  "form-8826",
  "schedule-c",
  "schedule-se",
  "schedule-1",
  "form-8995",
  "form-6251",
  "form-3800",
  "schedule-2",
  "schedule-3",
  "form-1040",
  "schedule-ca",
  "form-540",
];

export const flannScenario: Scenario = {
  name: "flann",
  description:
    "Single Fresno cleaning company owner, eligible by the employee test, with an accessible restroom: Form 8826 lines 1 to 8, Schedule C line 21 less the credit, Form 3800 line 1e, Schedule 3 line 6a, Schedule CA line 3 column B.",
  verification: "unverified",
  taxYear: FLANN_TAX_YEAR,
  userId: FLANN_USER_ID,
  facts: flannFacts,
  decisions: flannDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: flannExpected(formId),
    goldenPdfPath: lockedGoldenPath("flann", formId),
  })),
};
