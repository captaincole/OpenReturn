/*
 * A made-up single trial sponsor in San Diego (README.md): a business on
 * Schedule C that pays for the clinical testing of one orphan drug and does
 * not elect the reduced credit. Form 8820 lines 1 to 4, Schedule C lines 11,
 * 20a, 22 and 26 less line 2a, Form 3800 line 1h, Schedule 3 line 6a, and
 * California's Schedule CA line 3 column B, which adds the reduction back.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { ewardDecisions } from "./decisions.js";
import { ewardExpected } from "./expected.js";
import { EWARD_TAX_YEAR, EWARD_USER_ID, ewardFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-8820",
  "schedule-c",
  "schedule-se",
  "schedule-1",
  "form-8995-a",
  "form-6251",
  "form-3800",
  "form-8959",
  "schedule-2",
  "schedule-3",
  "form-1040",
  "schedule-ca",
  "form-540",
];

export const ewardScenario: Scenario = {
  name: "eward",
  description:
    "Single San Diego trial sponsor, no reduced credit election: Form 8820 lines 1 to 4, Schedule C lines 11, 20a, 22 and 26 less line 2a, Form 3800 line 1h, Schedule 3 line 6a, Schedule CA line 3 column B.",
  verification: "unverified",
  taxYear: EWARD_TAX_YEAR,
  userId: EWARD_USER_ID,
  facts: ewardFacts,
  decisions: ewardDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: ewardExpected(formId),
    goldenPdfPath: lockedGoldenPath("eward", formId),
  })),
};
