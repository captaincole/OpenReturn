/*
 * A made-up single filer in Texas (README.md): a pecan orchard (Schedule F)
 * with certified targeted group employees, and a Schedule K-1 (Form 1065) with
 * a work opportunity credit in box 15. Form 5884 lines 1a to 4, the wage
 * reduction on Schedule F line 22, and Form 3800 Part III line 4b, Part V and
 * Schedule 3 line 6a. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { byarDecisions } from "./decisions.js";
import { byarExpected } from "./expected.js";
import { BYAR_TAX_YEAR, BYAR_USER_ID, byarFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
export const FORM_IDS = [
  "form-5884",
  "schedule-f",
  "schedule-se",
  "schedule-e",
  "schedule-1",
  "form-8995-a",
  "form-3800",
  "schedule-2",
  "schedule-3",
  "form-1040",
];

export const byarScenario: Scenario = {
  name: "byar",
  description:
    "Single TX pecan farmer with targeted group employees and a K-1 code J: Form 5884 lines 1a to 4, Schedule F line 22 less the credit, Form 3800 line 4b and Part V, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: BYAR_TAX_YEAR,
  userId: BYAR_USER_ID,
  facts: byarFacts,
  decisions: byarDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: byarExpected(formId),
    goldenPdfPath: lockedGoldenPath("byar", formId),
  })),
};
