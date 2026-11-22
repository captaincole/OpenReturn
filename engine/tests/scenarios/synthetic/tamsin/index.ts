/*
 * A made-up single filer in Texas (README.md): a member of the Armed Forces with
 * a W-2 and a permanent change of station move (Form 3903, Schedule 1 line 14).
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { tamsinDecisions } from "./decisions.js";
import { tamsinExpected } from "./expected.js";
import { TAMSIN_TAX_YEAR, TAMSIN_USER_ID, tamsinFacts } from "./facts.js";

const FORM_IDS = ["form-3903", "schedule-1", "form-1040"];

export const tamsinScenario: Scenario = {
  name: "tamsin",
  description:
    "Single TX filer in the Armed Forces: a W-2 with box 12 code P and a permanent change of station move (Form 3903, Schedule 1 line 14).",
  verification: "unverified",
  taxYear: TAMSIN_TAX_YEAR,
  userId: TAMSIN_USER_ID,
  facts: tamsinFacts,
  decisions: tamsinDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: tamsinExpected(formId),
    goldenPdfPath: lockedGoldenPath("tamsin", formId),
  })),
};
