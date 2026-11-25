/*
 * A made-up married couple in Texas (README.md) with two home electric vehicle
 * chargers: Form 8911 Part II with two Schedules A, the $1,000 limit on one
 * item, the foreign tax credit and the child tax credit before the credit, and
 * the tentative minimum tax; the credit on Schedule 3 line 6j. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { pevaraDecisions } from "./decisions.js";
import { pevaraExpected } from "./expected.js";
import { PEVARA_TAX_YEAR, PEVARA_USER_ID, pevaraFacts } from "./facts.js";

const FORM_IDS = [
  "form-8911",
  "form-6251",
  "schedule-3",
  "schedule-2",
  "schedule-8812",
  "form-1040",
];

export const pevaraScenario: Scenario = {
  name: "pevara",
  description:
    "MFJ TX couple with two home EV chargers: Form 8911 Part II (one item at the $1,000 limit), the foreign tax and child tax credits before it, the tentative minimum tax, Schedule 3 line 6j.",
  verification: "unverified",
  taxYear: PEVARA_TAX_YEAR,
  userId: PEVARA_USER_ID,
  facts: pevaraFacts,
  decisions: pevaraDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: pevaraExpected(formId),
    goldenPdfPath: lockedGoldenPath("pevara", formId),
  })),
};
