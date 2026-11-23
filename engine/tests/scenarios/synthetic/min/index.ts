/*
 * A made-up married couple in Washington (README.md): one large W-2, a small
 * early IRA distribution with its additional tax (Schedule 2 line 8), student
 * loan interest, jury duty pay, and an S corporation K-1 with box 1 income and
 * a box 17 code V statement, so Form 8995 takes the corporation as a business.
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { minDecisions } from "./decisions.js";
import { minExpected } from "./expected.js";
import { MIN_TAX_YEAR, MIN_USER_ID, minFacts } from "./facts.js";

const FORM_IDS = ["schedule-e", "form-8995", "schedule-1", "schedule-2", "form-1040"];

export const minScenario: Scenario = {
  name: "min",
  description:
    "MFJ WA couple: one W-2, an early IRA 1099-R (code 1, Schedule 2 line 8), student loan interest, jury duty pay, an S corporation K-1 with box 1 income and a box 17 code V statement (Schedule E Part II, Form 8995 line 1).",
  verification: "unverified",
  taxYear: MIN_TAX_YEAR,
  userId: MIN_USER_ID,
  facts: minFacts,
  decisions: minDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: minExpected(formId),
    goldenPdfPath: lockedGoldenPath("min", formId),
  })),
};
