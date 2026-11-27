/*
 * A made-up single landscaping business owner in Texas (README.md): the
 * business built an on-site childcare center, runs it, buys infant care slots
 * at a licensed center and pays a referral service, and a Schedule K-1 (Form
 * 1065) from a staffing partnership carries the same credit in box 15 code AH.
 * Form 8882 lines 1 to 7, the credit taken off Schedule C lines 14, 22, 26
 * and 27b and off the building's basis on Form 4562, Form 3800 line 1k and
 * Schedule 3 line 6a. Federal only. UNVERIFIED: no answer key; the expected
 * values are engine output checked by hand, so a failure means "the engine
 * changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { jacDecisions } from "./decisions.js";
import { jacExpected } from "./expected.js";
import { JAC_TAX_YEAR, JAC_USER_ID, jacFacts } from "./facts.js";

const FORM_IDS = [
  "form-8882",
  "form-3800",
  "form-6251",
  "schedule-c",
  "form-4562",
  "schedule-se",
  "schedule-e",
  "form-8995-a",
  "form-8959",
  "schedule-1",
  "schedule-2",
  "schedule-3",
  "form-1040",
];

export const jacScenario: Scenario = {
  name: "jac",
  description:
    "Single TX landscaping owner with an on-site childcare center, operating costs, a contract with a licensed center, a referral service and a K-1 (Form 1065) code AH; Form 8882 lines 1 to 7, the credit off Schedule C lines 14, 22, 26, 27b and the building's Form 4562 basis, Form 3800 line 1k, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: JAC_TAX_YEAR,
  userId: JAC_USER_ID,
  facts: jacFacts,
  decisions: jacDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: jacExpected(formId),
    goldenPdfPath: lockedGoldenPath("jac", formId),
  })),
};
