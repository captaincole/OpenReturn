/*
 * A made-up single filer in South Dakota (README.md): a W-2, and a Schedule
 * K-1 (Form 1065) from a partnership whose tax year began July 1, 2024, with a
 * biofuel producer credit (box 15 code I). Form 6478 lines 3 and 4, Form 3800
 * Part III line 4c, Schedule 3 line 6a. Federal only. UNVERIFIED: no answer
 * key; the expected values are engine output checked by hand, so a failure
 * means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { lemDecisions } from "./decisions.js";
import { lemExpected } from "./expected.js";
import { LEM_TAX_YEAR, LEM_USER_ID, lemFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = ["form-6478", "schedule-e", "schedule-1", "form-3800", "schedule-3", "form-1040"];

export const lemScenario: Scenario = {
  name: "lem",
  description:
    "Single SD filer: a W-2 and a fiscal-year partnership K-1 with a code I biofuel producer credit; Form 6478 lines 3 and 4, Form 3800 line 4c, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: LEM_TAX_YEAR,
  userId: LEM_USER_ID,
  facts: lemFacts,
  decisions: lemDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: lemExpected(formId),
    goldenPdfPath: lockedGoldenPath("lem", formId),
  })),
};
