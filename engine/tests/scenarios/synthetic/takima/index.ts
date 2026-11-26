/*
 * A made-up head of household in Washington (README.md): one W-2, a son under
 * 17, and a District of Columbia first-time homebuyer credit carried from 2024.
 * Form 8859 with Credit Limit Worksheet B line 14 on worksheet line 2, the tax
 * limit on line 2, a carryforward to 2026, Schedule 3 line 6h and Schedule 8812
 * line 13. Federal only. UNVERIFIED: no answer key; the expected values are
 * engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { takimaDecisions } from "./decisions.js";
import { takimaExpected } from "./expected.js";
import { TAKIMA_TAX_YEAR, TAKIMA_USER_ID, takimaFacts } from "./facts.js";

const FORM_IDS = ["form-8859", "schedule-3", "schedule-8812", "form-1040"];

export const takimaScenario: Scenario = {
  name: "takima",
  description:
    "HOH WA filer: one W-2, a son under 17, a DC first-time homebuyer credit carried from 2024 (Form 8859 with Credit Limit Worksheet B line 14, the tax limit on line 2, a 2026 carryforward, Schedule 3 line 6h, Schedule 8812 line 13).",
  verification: "unverified",
  taxYear: TAKIMA_TAX_YEAR,
  userId: TAKIMA_USER_ID,
  facts: takimaFacts,
  decisions: takimaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: takimaExpected(formId),
    goldenPdfPath: lockedGoldenPath("takima", formId),
  })),
};
