/*
 * A made-up single filer in Florida (README.md): a W-2, a Form 1098, a Mortgage
 * Credit Certificate with credit carried forward from 2024 (Form 8396), and
 * attic insulation (Form 5695 Part II). She itemizes. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { wrenDecisions } from "./decisions.js";
import { wrenExpected } from "./expected.js";
import { WREN_TAX_YEAR, WREN_USER_ID, wrenFacts } from "./facts.js";

const FORM_IDS = ["form-5695", "form-8396", "schedule-3", "schedule-a", "form-1040"];

export const wrenScenario: Scenario = {
  name: "wren",
  description:
    "Single FL filer: a W-2, a Form 1098 and a Mortgage Credit Certificate with carryforwards (Form 8396, Schedule 3 line 6g, Schedule A line 8a), and insulation (Form 5695).",
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
