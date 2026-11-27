/*
 * A made-up single rancher in Wyoming (README.md): a farmer whose 2025
 * estimated tax payment was short on January 15, 2026. Form 2210-F with a
 * request to waive part of the penalty (box A), the penalty on Form 1040 line
 * 38 and in line 37. Federal only. UNVERIFIED: no answer key; the expected
 * values are engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { cerandinDecisions } from "./decisions.js";
import { cerandinExpected } from "./expected.js";
import { CERANDIN_TAX_YEAR, CERANDIN_USER_ID, cerandinFacts } from "./facts.js";

const FORM_IDS = [
  "form-2210-f",
  "form-1040",
  "schedule-1",
  "schedule-2",
  "schedule-3",
  "schedule-f",
  "schedule-se",
  "form-4136",
  "form-8995",
];

export const cerandinScenario: Scenario = {
  name: "cerandin",
  description:
    "Single WY rancher (two-thirds farm income): Form 2210-F with a partial waiver (box A), the penalty on Form 1040 lines 38 and 37; Form 2210 does not file.",
  verification: "unverified",
  taxYear: CERANDIN_TAX_YEAR,
  userId: CERANDIN_USER_ID,
  facts: cerandinFacts,
  decisions: cerandinDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: cerandinExpected(formId),
    goldenPdfPath: lockedGoldenPath("cerandin", formId),
  })),
};
