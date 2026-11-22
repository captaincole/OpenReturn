/*
 * A made-up single filer in California (README.md) who moved for a new job:
 * FTB 3913 line 5 Yes, Schedule CA (540) line 14 column C and Form 540 line 14.
 * No federal deduction: the federal suspension covers a move that is not
 * military. UNVERIFIED: no answer key; the expected values are engine output
 * checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { loialDecisions } from "./decisions.js";
import { loialExpected } from "./expected.js";
import { LOIAL_TAX_YEAR, LOIAL_USER_ID, loialFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = ["form-1040", "schedule-ca", "form-3913", "form-540"];

export const loialScenario: Scenario = {
  name: "loial",
  description:
    "Single CA filer who moved Sacramento to San Diego for a new job: FTB 3913 line 5 Yes, Schedule CA (540) line 14 column C and Form 540 line 14.",
  verification: "unverified",
  taxYear: LOIAL_TAX_YEAR,
  userId: LOIAL_USER_ID,
  facts: loialFacts,
  decisions: loialDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: loialExpected(formId),
    goldenPdfPath: lockedGoldenPath("loial", formId),
  })),
};
