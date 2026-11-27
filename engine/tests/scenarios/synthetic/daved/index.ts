/*
 * A made-up single filer in Sacramento (README.md): a landscaping company
 * (Schedule C) with two certified targeted group employees. Form 5884 lines
 * 1a, 1b and 2, Schedule C line 26 less the credit, Form 3800 line 4b,
 * Schedule 3 line 6a, and California's Schedule CA line 3 column B, which adds
 * the wages back. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { davedDecisions } from "./decisions.js";
import { davedExpected } from "./expected.js";
import { DAVED_TAX_YEAR, DAVED_USER_ID, davedFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
export const FORM_IDS = [
  "form-5884",
  "schedule-c",
  "schedule-se",
  "schedule-1",
  "form-8995",
  "form-3800",
  "schedule-2",
  "schedule-3",
  "form-1040",
  "schedule-ca",
  "form-540",
];

export const davedScenario: Scenario = {
  name: "daved",
  description:
    "Single Sacramento landscaper with two targeted group employees: Form 5884 lines 1a, 1b and 2, Schedule C line 26 less the credit, Form 3800 line 4b, Schedule 3 line 6a, Schedule CA line 3 column B.",
  verification: "unverified",
  taxYear: DAVED_TAX_YEAR,
  userId: DAVED_USER_ID,
  facts: davedFacts,
  decisions: davedDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: davedExpected(formId),
    goldenPdfPath: lockedGoldenPath("daved", formId),
  })),
};
