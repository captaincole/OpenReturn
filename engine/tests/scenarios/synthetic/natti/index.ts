/*
 * A made-up single salon owner in Texas (README.md): a hair, nail and spa
 * salon on Schedule C with tipped employees, and a Schedule K-1 (Form 1065)
 * from a restaurant partnership with the same credit in box 15 code N. Form
 * 8846 every line, the line 4 box, Schedule C line 23 reduced by line 4, Form
 * 3800 line 4f and Schedule 3 line 6a. Federal only. UNVERIFIED: no answer
 * key; the expected values are engine output checked by hand, so a failure
 * means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { nattiDecisions } from "./decisions.js";
import { nattiExpected } from "./expected.js";
import { NATTI_TAX_YEAR, NATTI_USER_ID, nattiFacts } from "./facts.js";

const FORM_IDS = [
  "form-8846",
  "form-3800",
  "schedule-c",
  "schedule-se",
  "schedule-e",
  "form-8995",
  "schedule-1",
  "schedule-2",
  "schedule-3",
  "form-1040",
];

export const nattiScenario: Scenario = {
  name: "natti",
  description:
    "Single TX salon owner: tipped employees paid below $7.25 in some months and one over the wage base, and a K-1 (Form 1065) code N; Form 8846 every line, Schedule C line 23 reduced by line 4, Form 3800 line 4f, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: NATTI_TAX_YEAR,
  userId: NATTI_USER_ID,
  facts: nattiFacts,
  decisions: nattiDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: nattiExpected(formId),
    goldenPdfPath: lockedGoldenPath("natti", formId),
  })),
};
