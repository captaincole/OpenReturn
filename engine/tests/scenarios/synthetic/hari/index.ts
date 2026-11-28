/*
 * A made-up single filer in Texas (README.md): a cotton farm (Schedule F) with
 * 12 employees and a 401(k) plan in its first year. Form 8881 Part I with the
 * $500 floor on line 4 and no line 6e, Schedule F line 23 less both credits,
 * Form 3800 line 1j and Schedule 3 line 6a. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { hariDecisions } from "./decisions.js";
import { hariExpected } from "./expected.js";
import { HARI_TAX_YEAR, HARI_USER_ID, hariFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
export const FORM_IDS = [
  "form-8881",
  "schedule-f",
  "schedule-se",
  "schedule-1",
  "form-8995",
  "form-6251",
  "form-3800",
  "schedule-2",
  "schedule-3",
  "form-1040",
];

export const hariScenario: Scenario = {
  name: "hari",
  description:
    "Single TX cotton farmer with a first-year 401(k) plan and 12 employees: Form 8881 Part I, Schedule F line 23 less both credits, Form 3800 line 1j, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: HARI_TAX_YEAR,
  userId: HARI_USER_ID,
  facts: hariFacts,
  decisions: hariDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: hariExpected(formId),
    goldenPdfPath: lockedGoldenPath("hari", formId),
  })),
};
