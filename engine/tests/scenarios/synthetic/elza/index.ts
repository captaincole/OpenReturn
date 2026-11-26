/*
 * A made-up single filer in Nevada (README.md): a steel fabricator's contract
 * price comes down after completion, and the look-back runs on the simplified
 * marginal impact method (Form 8697 Part II) over three prior years. The net is
 * interest to be refunded, claimed on the form itself, so Schedule 2 line 17n
 * stays blank. Federal only. UNVERIFIED: no answer key; the expected values are
 * engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { elzaDecisions } from "./decisions.js";
import { elzaExpected } from "./expected.js";
import { ELZA_TAX_YEAR, ELZA_USER_ID, elzaFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "schedule-c",
  "schedule-se",
  "form-8995",
  "schedule-1",
  "form-8697",
  "schedule-2",
  "form-1040",
];

export const elzaScenario: Scenario = {
  name: "elza",
  description:
    "Single NV steel fabricator: a post-completion price cut, Form 8697 Part II (SMIM) over 2021–2023 with the line 6 ceiling, net interest refunded by direct deposit (line 10a), filed and paid early.",
  verification: "unverified",
  taxYear: ELZA_TAX_YEAR,
  userId: ELZA_USER_ID,
  facts: elzaFacts,
  decisions: elzaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: elzaExpected(formId),
    goldenPdfPath: lockedGoldenPath("elza", formId),
  })),
};
