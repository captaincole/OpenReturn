/*
 * A made-up California resident (README.md): three canceled debts on Forms
 * 1099-C. Form 982 for a nonbusiness debt while insolvent (lines 1b, 2 and the
 * line 10a basis limit) and a mortgage principal reduction (lines 1e and 10b);
 * Schedule 1 line 8c; Schedule CA line 8c columns A and C (California does not
 * follow the principal residence exclusion). UNVERIFIED: no answer key; the
 * expected values are engine output checked by hand, so a failure means "the
 * engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { berowynDecisions } from "./decisions.js";
import { berowynExpected } from "./expected.js";
import { BEROWYN_TAX_YEAR, BEROWYN_USER_ID, berowynFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
export const FORM_IDS = ["form-982", "schedule-1", "form-1040", "schedule-ca", "form-540"];

export const berowynScenario: Scenario = {
  name: "berowyn",
  description:
    "Single Sacramento filer with three Forms 1099-C: Form 982 lines 1b, 1e, 10a (the basis limit with money) and 10b; Schedule 1 line 8c; Schedule CA line 8c columns A and C.",
  verification: "unverified",
  taxYear: BEROWYN_TAX_YEAR,
  userId: BEROWYN_USER_ID,
  facts: berowynFacts,
  decisions: berowynDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: berowynExpected(formId),
    goldenPdfPath: lockedGoldenPath("berowyn", formId),
  })),
};
