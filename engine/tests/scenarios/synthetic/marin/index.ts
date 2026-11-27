/*
 * A made-up single filer in Texas (README.md): a citrus grove (Schedule F) in
 * the Rio Grande Valley empowerment zone with three hands, one of them also
 * figuring a work opportunity credit. Form 8844 lines 1, 2 and 4, the labor
 * deduction it lowers (Schedule F line 22), Form 3800 Part III lines 3 and 4b,
 * and Schedule 3 line 6a. Federal only. UNVERIFIED: no answer key; the
 * expected values are engine output checked by hand, so a failure means "the
 * engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { marinDecisions } from "./decisions.js";
import { marinExpected } from "./expected.js";
import { MARIN_TAX_YEAR, MARIN_USER_ID, marinFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-8844",
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

export const marinScenario: Scenario = {
  name: "marin",
  description:
    "Single TX filer: a Schedule F citrus grove with empowerment zone hands, one with work opportunity credit wages; Form 8844 lines 1, 2 and 4, Schedule F line 22 less both credits, Form 3800 lines 3 and 4b, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: MARIN_TAX_YEAR,
  userId: MARIN_USER_ID,
  facts: marinFacts,
  decisions: marinDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: marinExpected(formId),
    goldenPdfPath: lockedGoldenPath("marin", formId),
  })),
};
