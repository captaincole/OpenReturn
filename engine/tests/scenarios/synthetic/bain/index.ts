/*
 * A made-up single filer in Texas (README.md): a W-2 and three installment
 * sales of business property made in earlier years (Form 6252, three copies),
 * one to his brother who resold it in 2025 (Part III). The results reach Form
 * 4797 lines 4, 10 and 15 and Schedule D lines 11 and 19. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { bainDecisions } from "./decisions.js";
import { bainExpected } from "./expected.js";
import { BAIN_TAX_YEAR, BAIN_USER_ID, bainFacts } from "./facts.js";

const FORM_IDS = [
  "form-6252",
  "form-4797",
  "schedule-d",
  "schedule-1",
  "form-8960",
  "schedule-2",
  "form-1040",
];

export const bainScenario: Scenario = {
  name: "bain",
  description:
    "Single TX filer: three installment sales from earlier years, one resold by his brother in 2025 (Form 6252 Parts I–III, three copies; Form 4797 lines 4, 10 and 15; Schedule D lines 11 and 19).",
  verification: "unverified",
  taxYear: BAIN_TAX_YEAR,
  userId: BAIN_USER_ID,
  facts: bainFacts,
  decisions: bainDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: bainExpected(formId),
    goldenPdfPath: lockedGoldenPath("bain", formId),
  })),
};
