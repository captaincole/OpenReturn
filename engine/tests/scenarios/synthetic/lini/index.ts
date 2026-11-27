/*
 * A made-up head of household in Florida (README.md): one W-2, three
 * children, and an earlier denial of the EIC, the child tax credit and the
 * AOTC. Form 8862 with Parts I to IV (Section A), Schedule EIC, Schedule
 * 8812, Form 8863, Schedule 3 and Form 1040. Federal only. UNVERIFIED: no
 * answer key; the expected values are engine output checked by hand, so a
 * failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { liniDecisions } from "./decisions.js";
import { liniExpected } from "./expected.js";
import { LINI_TAX_YEAR, LINI_USER_ID, liniFacts } from "./facts.js";

const FORM_IDS = [
  "form-8862",
  "schedule-eic",
  "schedule-8812",
  "form-8863",
  "schedule-3",
  "form-1040",
];

export const liniScenario: Scenario = {
  name: "lini",
  description:
    "HOH FL filer, three children, EIC, child tax credit and AOTC each denied in an earlier year (Form 8862 Parts I–IV, Section A; Schedule EIC, Schedule 8812, Form 8863, Form 1040 lines 19, 27a, 28, 29).",
  verification: "unverified",
  taxYear: LINI_TAX_YEAR,
  userId: LINI_USER_ID,
  facts: liniFacts,
  decisions: liniDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: liniExpected(formId),
    goldenPdfPath: lockedGoldenPath("lini", formId),
  })),
};
