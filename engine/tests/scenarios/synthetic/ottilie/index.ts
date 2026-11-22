/*
 * Made-up taxpayers (README.md): a married couple filing jointly, full-year
 * California residents, with two children in care in Fresno and a dependent
 * care FSA. FTB 3506 fills Parts I to IV and its credit goes to Form 540
 * line 40. No answer key: the expected values are hand-checked, locked engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { ottilieDecisions } from "./decisions.js";
import { ottilieExpected } from "./expected.js";
import { OTTILIE_TAX_YEAR, OTTILIE_USER_ID, ottilieFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-2441",
  "schedule-8812",
  "schedule-3",
  "form-1040",
  "schedule-ca",
  "form-3506",
  "form-540",
];

export const ottilieScenario: Scenario = {
  name: "ottilie",
  description:
    "MFJ Fresno couple: two W-2s, a dependent care FSA, a preschool and a babysitter for two children (one in shared custody); FTB 3506 Parts I to IV and Form 540 line 40.",
  taxYear: OTTILIE_TAX_YEAR,
  userId: OTTILIE_USER_ID,
  verification: "unverified",
  facts: ottilieFacts,
  decisions: ottilieDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: ottilieExpected(formId),
    goldenPdfPath: lockedGoldenPath("ottilie", formId),
  })),
};
