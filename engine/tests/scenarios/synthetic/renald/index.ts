/*
 * A made-up single filer in Texas (README.md): a W-2 and two Schedules K-1
 * (Form 1065) from partnerships he works in, with general business credits in
 * box 15, and four credit carryovers from last year's return. Form 3800 limits
 * the credits by the tax: the research credit limitation, the $5,000 cap on
 * the disabled access credit, the empowerment zone section, the specified
 * credits, and Parts V and VI. The allowed credit reaches Schedule 3 line 6a.
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { renaldDecisions } from "./decisions.js";
import { renaldExpected } from "./expected.js";
import { RENALD_TAX_YEAR, RENALD_USER_ID, renaldFacts } from "./facts.js";

const FORM_IDS = [
  "form-3800",
  "form-6251",
  "schedule-e",
  "schedule-1",
  "schedule-2",
  "schedule-3",
  "form-8959",
  "form-1040",
];

export const renaldScenario: Scenario = {
  name: "renald",
  description:
    "Single TX filer: two K-1s (Form 1065) with box 15 general business credits and four carryovers; Form 3800 with the research limitation, the disabled access cap, the empowerment zone and specified credit sections, Parts V and VI; Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: RENALD_TAX_YEAR,
  userId: RENALD_USER_ID,
  facts: renaldFacts,
  decisions: renaldDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: renaldExpected(formId),
    goldenPdfPath: lockedGoldenPath("renald", formId),
  })),
};
