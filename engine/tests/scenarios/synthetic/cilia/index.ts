/*
 * A made-up single grain farmer in South Dakota (README.md): a farm on
 * Schedule F with two hired hands who served on active duty. Form 8932 lines
 * 1, 2 and 4, Schedule F line 22 less the credit, Form 3800 line 1w, Schedule
 * 3 line 6a. Federal only. The branch basel cannot show: the engine figures
 * QBI for one self-employed activity at a time, so the farm is its own
 * taxpayer. UNVERIFIED: no answer key; the expected values are engine output
 * checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { ciliaDecisions } from "./decisions.js";
import { ciliaExpected } from "./expected.js";
import { CILIA_TAX_YEAR, CILIA_USER_ID, ciliaFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
export const FORM_IDS = [
  "form-8932",
  "schedule-f",
  "schedule-se",
  "schedule-1",
  "form-8995",
  "form-6251",
  "form-3800",
  "schedule-2",
  "schedule-3",
  "form-1040",
];

export const ciliaScenario: Scenario = {
  name: "cilia",
  description:
    "Single SD grain farmer with two reservist hired hands: Form 8932 lines 1, 2 and 4, Schedule F line 22 less the credit, Form 3800 line 1w, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: CILIA_TAX_YEAR,
  userId: CILIA_USER_ID,
  facts: ciliaFacts,
  decisions: ciliaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: ciliaExpected(formId),
    goldenPdfPath: lockedGoldenPath("cilia", formId),
  })),
};
