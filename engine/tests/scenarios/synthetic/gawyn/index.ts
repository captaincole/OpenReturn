/*
 * A made-up married couple (README.md) who file jointly as full-year
 * California residents. Each spouse was paid as a contractor by a firm that
 * should have treated them as an employee, so each files a Form 8919. Form
 * 1040 line 1g and Schedule 2 line 6 add both forms; Schedule CA (540) line 1g
 * copies line 1g. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { gawynDecisions } from "./decisions.js";
import { gawynExpected } from "./expected.js";
import { GAWYN_TAX_YEAR, GAWYN_USER_ID, gawynFacts } from "./facts.js";

const FORM_IDS = ["form-8919", "schedule-2", "form-1040", "schedule-ca", "form-540"];

export const gawynScenario: Scenario = {
  name: "gawyn",
  description:
    "MFJ Sacramento couple: one W-2 and a Form 8919 for each spouse (codes G and A); 1040 line 1g and Schedule 2 line 6 add both forms, Schedule CA line 1g copies line 1g.",
  verification: "unverified",
  taxYear: GAWYN_TAX_YEAR,
  userId: GAWYN_USER_ID,
  facts: gawynFacts,
  decisions: gawynDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: gawynExpected(formId),
    goldenPdfPath: lockedGoldenPath("gawyn", formId),
  })),
};
