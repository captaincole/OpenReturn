/*
 * A made-up single filer in Washington (README.md): an accumulation
 * distribution from a domestic trust created in 1979, thrown back to five
 * years (Form 4970 with every line, the partial tax on Schedule 2 line 17l).
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { seaineDecisions } from "./decisions.js";
import { seaineExpected } from "./expected.js";
import { SEAINE_TAX_YEAR, SEAINE_USER_ID, seaineFacts } from "./facts.js";

const FORM_IDS = ["form-4970", "schedule-2", "form-1040"];

export const seaineScenario: Scenario = {
  name: "seaine",
  description:
    "Single WA filer: an accumulation distribution from a 1979 domestic trust thrown back to five years, one before age 21 and one under 25% of the average (Form 4970, Schedule 2 line 17l).",
  verification: "unverified",
  taxYear: SEAINE_TAX_YEAR,
  userId: SEAINE_USER_ID,
  facts: seaineFacts,
  decisions: seaineDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: seaineExpected(formId),
    goldenPdfPath: lockedGoldenPath("seaine", formId),
  })),
};
