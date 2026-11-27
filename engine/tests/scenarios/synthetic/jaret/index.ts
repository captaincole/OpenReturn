/*
 * A made-up single filer in Texas (README.md): a commercial cleaning company
 * (Schedule C) in the El Paso empowerment zone with five employees, and a
 * Schedule K-1 (Form 1065) with an empowerment zone credit (box 15 code L).
 * Form 8844 lines 1 to 4, the wage deduction it lowers (Schedule C line 26),
 * Form 3800 Part III line 3 and Part II Section B, and Schedule 3 line 6a.
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { jaretDecisions } from "./decisions.js";
import { jaretExpected } from "./expected.js";
import { JARET_TAX_YEAR, JARET_USER_ID, jaretFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-8844",
  "schedule-c",
  "schedule-se",
  "schedule-e",
  "schedule-1",
  "form-8995",
  "form-6251",
  "form-3800",
  "schedule-2",
  "schedule-3",
  "form-1040",
];

export const jaretScenario: Scenario = {
  name: "jaret",
  description:
    "Single TX filer: a Schedule C cleaning company with empowerment zone employees and a K-1 code L credit; Form 8844 lines 1 to 4, Schedule C line 26 less the credit, Form 3800 line 3 and Section B, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: JARET_TAX_YEAR,
  userId: JARET_USER_ID,
  facts: jaretFacts,
  decisions: jaretDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: jaretExpected(formId),
    goldenPdfPath: lockedGoldenPath("jaret", formId),
  })),
};
