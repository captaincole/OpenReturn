/*
 * A made-up single filer in Texas (README.md): a freight company on Schedule C
 * with three employees who served on active duty, and a Schedule K-1 (Form
 * 1065) with a credit for employer differential wage payments in box 15 code
 * AV. Form 8932 lines 1 to 4, Schedule C line 26 less the credit, Form 3800
 * line 1w, Schedule 3 line 6a. Federal only. UNVERIFIED: no answer key; the
 * expected values are engine output checked by hand, so a failure means "the
 * engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { baselDecisions } from "./decisions.js";
import { baselExpected } from "./expected.js";
import { BASEL_TAX_YEAR, BASEL_USER_ID, baselFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
export const FORM_IDS = [
  "form-8932",
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

export const baselScenario: Scenario = {
  name: "basel",
  description:
    "Single TX freight company owner with three reservist employees (one over the $20,000 limit, one not a qualified employee) and a K-1 (Form 1065) code AV: Form 8932 lines 1 to 4, Schedule C line 26 less the credit, Form 3800 line 1w, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: BASEL_TAX_YEAR,
  userId: BASEL_USER_ID,
  facts: baselFacts,
  decisions: baselDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: baselExpected(formId),
    goldenPdfPath: lockedGoldenPath("basel", formId),
  })),
};
