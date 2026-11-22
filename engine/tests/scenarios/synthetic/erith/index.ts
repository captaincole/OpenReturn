/*
 * A made-up single filer in California (README.md) who moved for a new job and
 * was paid more than the move cost, outside W-2 box 1: FTB 3913 line 5 No,
 * Schedule CA (540) line 1h column C and Form 540 line 16. UNVERIFIED: no
 * answer key; the expected values are engine output checked by hand, so a
 * failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { erithDecisions } from "./decisions.js";
import { erithExpected } from "./expected.js";
import { ERITH_TAX_YEAR, ERITH_USER_ID, erithFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = ["form-1040", "schedule-ca", "form-3913", "form-540"];

export const erithScenario: Scenario = {
  name: "erith",
  description:
    "Single CA filer who moved Fresno to Oakland for a new job, with a relocation allowance outside W-2 box 1 that is more than the cost: FTB 3913 line 5 No, Schedule CA (540) line 1h column C and Form 540 line 16.",
  verification: "unverified",
  taxYear: ERITH_TAX_YEAR,
  userId: ERITH_USER_ID,
  facts: erithFacts,
  decisions: erithDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: erithExpected(formId),
    goldenPdfPath: lockedGoldenPath("erith", formId),
  })),
};
