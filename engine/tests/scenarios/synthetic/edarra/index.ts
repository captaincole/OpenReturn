/*
 * A made-up single filer in California (README.md): a grapevine nursery on the
 * accrual method (Schedule F Part III with inventory) with a loss that Form
 * 6198 limits (box 36b). The loss is more than $156,500, so Form 461 files
 * (line 6), and it reaches Schedule CA (540) line 6 and FTB 3461 line 6.
 * UNVERIFIED: no answer key; the expected values are engine output checked
 * by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { edarraDecisions } from "./decisions.js";
import { edarraExpected } from "./expected.js";
import { EDARRA_TAX_YEAR, EDARRA_USER_ID, edarraFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
export const FORM_IDS = [
  "schedule-f",
  "form-6198",
  "form-461",
  "schedule-1",
  "form-8995-a",
  "form-8995-a-schedule-c",
  "form-8959",
  "schedule-2",
  "form-1040",
  "schedule-ca",
  "form-3461",
  "form-540",
];

export const edarraScenario: Scenario = {
  name: "edarra",
  description:
    "Single CA filer with a grapevine nursery on the accrual method: Schedule F Part III with inventory, a loss limited by Form 6198 (box 36b), Form 461 line 6, Schedule CA (540) line 6 and FTB 3461 line 6.",
  verification: "unverified",
  taxYear: EDARRA_TAX_YEAR,
  userId: EDARRA_USER_ID,
  facts: edarraFacts,
  decisions: edarraDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: edarraExpected(formId),
    goldenPdfPath: lockedGoldenPath("edarra", formId),
  })),
};
