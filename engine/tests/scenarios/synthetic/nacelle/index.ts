/*
 * A made-up single filer in Nevada (README.md): two jobs in 2025 whose social
 * security tax together passes the $10,918.20 maximum, and a payment with her
 * Form 4868 extension. Schedule 3 lines 10, 11 and 15, Form 1040 line 31.
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { nacelleDecisions } from "./decisions.js";
import { nacelleExpected } from "./expected.js";
import { NACELLE_TAX_YEAR, NACELLE_USER_ID, nacelleFacts } from "./facts.js";

const FORM_IDS = ["schedule-3", "form-1040"];

export const nacelleScenario: Scenario = {
  name: "nacelle",
  description:
    "Single NV filer with two employers over the social security wage base and a payment with Form 4868: Schedule 3 lines 10, 11 and 15, Form 1040 line 31.",
  verification: "unverified",
  taxYear: NACELLE_TAX_YEAR,
  userId: NACELLE_USER_ID,
  facts: nacelleFacts,
  decisions: nacelleDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: nacelleExpected(formId),
    goldenPdfPath: lockedGoldenPath("nacelle", formId),
  })),
};
