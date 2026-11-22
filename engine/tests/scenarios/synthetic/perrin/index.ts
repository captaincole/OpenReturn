/*
 * A made-up married couple in Texas (README.md): two W-2s, both spouses in
 * school. Perrin takes the American opportunity credit (two institutions),
 * Marisol the lifetime learning credit; their MAGI sits in the phase-out.
 * Form 8863 with two Parts III, Schedule 3 line 3 and Form 1040 line 29.
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { perrinDecisions } from "./decisions.js";
import { perrinExpected } from "./expected.js";
import { PERRIN_TAX_YEAR, PERRIN_USER_ID, perrinFacts } from "./facts.js";

const FORM_IDS = ["form-8863", "schedule-3", "form-1040"];

export const perrinScenario: Scenario = {
  name: "perrin",
  description:
    "MFJ TX couple, both students: American opportunity credit at two institutions and a lifetime learning credit, MAGI in the phase-out (Form 8863 with two Parts III, Schedule 3 line 3, Form 1040 line 29).",
  verification: "unverified",
  taxYear: PERRIN_TAX_YEAR,
  userId: PERRIN_USER_ID,
  facts: perrinFacts,
  decisions: perrinDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: perrinExpected(formId),
    goldenPdfPath: lockedGoldenPath("perrin", formId),
  })),
};
