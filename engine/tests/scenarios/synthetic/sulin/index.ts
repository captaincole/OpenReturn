/*
 * A made-up single sugar beet farmer in Wyoming (README.md): four farm hands
 * on Schedule F (3 FTEs, $32,000 of average wages), three of them enrolled in
 * SHOP plans that cost more than the Goshen County average. Form 8941 with no
 * phaseout, Schedule F line 15 reduced by line 12, Form 3800 line 4h and
 * Schedule 3 line 6a. Federal only. UNVERIFIED: no answer key; the expected
 * values are engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { sulinDecisions } from "./decisions.js";
import { sulinExpected } from "./expected.js";
import { SULIN_TAX_YEAR, SULIN_USER_ID, sulinFacts } from "./facts.js";

const FORM_IDS = [
  "form-8941",
  "form-3800",
  "schedule-f",
  "schedule-se",
  "schedule-1",
  "form-8995",
  "schedule-2",
  "schedule-3",
  "form-1040",
];

export const sulinScenario: Scenario = {
  name: "sulin",
  description:
    "Single WY sugar beet farmer: 4 employees (3 FTEs, $32,000 average wages), SHOP premiums above the county average; Form 8941 with no phaseout, Schedule F line 15 reduced by line 12, Form 3800 line 4h, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: SULIN_TAX_YEAR,
  userId: SULIN_USER_ID,
  facts: sulinFacts,
  decisions: sulinDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: sulinExpected(formId),
    goldenPdfPath: lockedGoldenPath("sulin", formId),
  })),
};
