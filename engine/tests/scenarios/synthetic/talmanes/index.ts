/*
 * A made-up married couple in Tennessee (README.md): two W-2s, a stock vest
 * withheld in February, bank interest, and one estimated tax payment in
 * January 2026. Form 2210 with boxes B, D and E: withholding on its actual
 * dates, a waiver of part of the penalty, and a joint return after two single
 * 2024 returns. The penalty comes off the refund (Form 1040 lines 35a and 38).
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { talmanesDecisions } from "./decisions.js";
import { talmanesExpected } from "./expected.js";
import { TALMANES_TAX_YEAR, TALMANES_USER_ID, talmanesFacts } from "./facts.js";

const FORM_IDS = ["form-2210", "form-1040", "schedule-b", "schedule-2", "form-8959", "form-8960"];

export const talmanesScenario: Scenario = {
  name: "talmanes",
  description:
    "MFJ TN couple, single in 2024: Form 2210 page 1 and Part III with boxes B, D and E (withholding by date, part of the penalty waived), the penalty taken off the refund on Form 1040 lines 35a and 38.",
  verification: "unverified",
  taxYear: TALMANES_TAX_YEAR,
  userId: TALMANES_USER_ID,
  facts: talmanesFacts,
  decisions: talmanesDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: talmanesExpected(formId),
    goldenPdfPath: lockedGoldenPath("talmanes", formId),
  })),
};
