/*
 * A made-up single bicycle shop owner in Sacramento, California (README.md):
 * six employees on Schedule C (4 FTEs, $32,000 of average wages), one of them
 * seasonal and enrolled, and SHOP premiums below the county average. Form 8941
 * lines A to 16 with no phaseout, Schedule C line 14 reduced by line 12, Form
 * 3800 line 4h, Schedule 3 line 6a and Schedule CA line 3 column B, where
 * California gives the deduction back. UNVERIFIED: no answer key; the expected
 * values are engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { kenlyDecisions } from "./decisions.js";
import { kenlyExpected } from "./expected.js";
import { KENLY_TAX_YEAR, KENLY_USER_ID, kenlyFacts } from "./facts.js";

const FORM_IDS = [
  "form-8941",
  "form-3800",
  "schedule-c",
  "schedule-se",
  "schedule-1",
  "form-8995",
  "schedule-2",
  "schedule-3",
  "form-1040",
  "schedule-ca",
  "form-540",
];

export const kenlyScenario: Scenario = {
  name: "kenly",
  description:
    "Single Sacramento bicycle shop owner: 6 employees (4 FTEs, $32,000 average wages, one seasonal and enrolled), SHOP premiums below the county average; Form 8941 with no phaseout, Schedule C line 14 reduced by line 12, Form 3800 line 4h, Schedule 3 line 6a, Schedule CA line 3 column B.",
  verification: "unverified",
  taxYear: KENLY_TAX_YEAR,
  userId: KENLY_USER_ID,
  facts: kenlyFacts,
  decisions: kenlyDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: kenlyExpected(formId),
    goldenPdfPath: lockedGoldenPath("kenly", formId),
  })),
};
