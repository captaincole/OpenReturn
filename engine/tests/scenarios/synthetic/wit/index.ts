/*
 * A made-up single filer in Texas (README.md): a wind power business with two
 * facilities on two Forms 8835, one in service in 2023 (line 4e of Form 3800)
 * and one in 2019 (line 1f), the credit limit and Schedule 3 line 6a. Federal
 * only. UNVERIFIED: no answer key; the expected values are engine output
 * checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { witDecisions } from "./decisions.js";
import { witExpected } from "./expected.js";
import { WIT_TAX_YEAR, WIT_USER_ID, witFacts } from "./facts.js";

const FORM_IDS = [
  "form-8835",
  "form-3800",
  "form-6251",
  "schedule-3",
  "form-1040",
  "schedule-1",
  "schedule-2",
  "schedule-c",
  "schedule-se",
  "form-8959",
  "form-8995-a",
];

export const witScenario: Scenario = {
  name: "wit",
  description:
    "Single TX filer with a wind power business: two facilities on two Forms 8835 (a 2023 facility with the bond reduction and the 5x and bonus amounts; a 2019 facility with the wind phase-down), Form 3800 lines 4e and 1f, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: WIT_TAX_YEAR,
  userId: WIT_USER_ID,
  facts: witFacts,
  decisions: witDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: witExpected(formId),
    goldenPdfPath: lockedGoldenPath("wit", formId),
  })),
};
