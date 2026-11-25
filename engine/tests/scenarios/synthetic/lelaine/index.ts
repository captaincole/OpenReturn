/*
 * Made-up taxpayers (README.md): a married couple filing jointly, full-year
 * California residents, with a household of six where some members went
 * without health coverage. FTB 3853 fills Parts I, III and IV and its penalty
 * goes to Form 540 lines 92 and 96. No answer key: the expected values are
 * hand-checked, locked engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { lelaineDecisions } from "./decisions.js";
import { lelaineExpected } from "./expected.js";
import { LELAINE_TAX_YEAR, LELAINE_USER_ID, lelaineFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = ["schedule-8812", "form-1040", "schedule-ca", "form-3853", "form-540"];

export const lelaineScenario: Scenario = {
  name: "lelaine",
  description:
    "MFJ Sacramento couple: two W-2s, three children (one turns 18, one born in 2025) and an adult daughter not claimed; FTB 3853 codes Z, C, X, K, M, F, I and A, Worksheets A and B, and Form 540 lines 92 and 96.",
  taxYear: LELAINE_TAX_YEAR,
  userId: LELAINE_USER_ID,
  verification: "unverified",
  facts: lelaineFacts,
  decisions: lelaineDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: lelaineExpected(formId),
    goldenPdfPath: lockedGoldenPath("lelaine", formId),
  })),
};
