/*
 * A made-up married couple in Texas (README.md): two W-2s with 401(k)
 * deferrals, Roth IRA contributions, a direct rollover and a 2024 Roth withdrawal.
 * Form 8880 with both columns, the tax limit on line 11, and Schedule 3 line 4.
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { wrenDecisions } from "./decisions.js";
import { wrenExpected } from "./expected.js";
import { WREN_TAX_YEAR, WREN_USER_ID, wrenFacts } from "./facts.js";

const FORM_IDS = ["form-8880", "schedule-3", "form-1040"];

export const wrenScenario: Scenario = {
  name: "wren",
  description:
    "MFJ TX couple: two W-2s with 401(k) deferrals, two Roth IRAs, a direct rollover, a 2024 Roth withdrawal (Form 8880 both columns, line 11 limits the credit, Schedule 3 line 4).",
  verification: "unverified",
  taxYear: WREN_TAX_YEAR,
  userId: WREN_USER_ID,
  facts: wrenFacts,
  decisions: wrenDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: wrenExpected(formId),
    goldenPdfPath: lockedGoldenPath("wren", formId),
  })),
};
