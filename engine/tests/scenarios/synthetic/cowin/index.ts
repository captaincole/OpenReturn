/*
 * A made-up single filer in Seattle (README.md): a sensor lab (Schedule C)
 * that claims the regular research credit with Section G filled, and a
 * Schedule K-1 (Form 1065) with a research credit in box 15 code M. Form 6765
 * Sections A, C, E, F and G, the section 280C reduction of Schedule C line
 * 26, Form 3800 Part III lines 1c and 4i, and Schedule 3 line 6a. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { cowinDecisions } from "./decisions.js";
import { cowinExpected } from "./expected.js";
import { COWIN_TAX_YEAR, COWIN_USER_ID, cowinFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
export const FORM_IDS = [
  "form-6765",
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

export const cowinScenario: Scenario = {
  name: "cowin",
  description:
    "Single WA sensor lab owner with the regular research credit and a K-1 code M: Form 6765 Sections A, C, E, F and G, Schedule C line 26 less the credit, Form 3800 lines 1c and 4i, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: COWIN_TAX_YEAR,
  userId: COWIN_USER_ID,
  facts: cowinFacts,
  decisions: cowinDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: cowinExpected(formId),
    goldenPdfPath: lockedGoldenPath("cowin", formId),
  })),
};
