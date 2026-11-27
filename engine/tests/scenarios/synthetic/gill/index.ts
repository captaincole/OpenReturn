/*
 * A made-up single filer in Texas (README.md): a catering company (Schedule C)
 * with 58 employees and a 401(k) plan in its third year, and a Schedule K-1
 * (Form 1065) with box 15 codes AE, AF and AG. Every line of Form 8881, the
 * reductions on Schedule C lines 17 and 19, Form 3800 lines 1j, 1dd and 1ee,
 * and Schedule 3 line 6a. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { gillDecisions } from "./decisions.js";
import { gillExpected } from "./expected.js";
import { GILL_TAX_YEAR, GILL_USER_ID, gillFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
export const FORM_IDS = [
  "form-8881",
  "schedule-c",
  "schedule-se",
  "schedule-e",
  "schedule-1",
  "form-8995-a",
  "form-6251",
  "form-3800",
  "form-8959",
  "schedule-2",
  "schedule-3",
  "form-1040",
];

export const gillScenario: Scenario = {
  name: "gill",
  description:
    "Single TX caterer with a third-year 401(k) plan, 58 employees and a K-1 with codes AE, AF and AG: every line of Form 8881, Schedule C lines 17 and 19 less the credits, Form 3800 lines 1j, 1dd and 1ee, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: GILL_TAX_YEAR,
  userId: GILL_USER_ID,
  facts: gillFacts,
  decisions: gillDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: gillExpected(formId),
    goldenPdfPath: lockedGoldenPath("gill", formId),
  })),
};
