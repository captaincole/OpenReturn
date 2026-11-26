/*
 * A made-up single landowner in Florida (README.md): a real estate
 * professional who materially participated in a crop-share farm rental with a
 * loss. Form 4835 box 34a and the deductible loss on line 34c, carried to
 * Schedule E lines 40, 41 and 43 with no Form 8582. Federal only. UNVERIFIED:
 * no answer key; the expected values are engine output checked by hand, so a
 * failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { keilleDecisions } from "./decisions.js";
import { keilleExpected } from "./expected.js";
import { KEILLE_TAX_YEAR, KEILLE_USER_ID, keilleFacts } from "./facts.js";

const FORM_IDS = ["form-4835", "schedule-e", "schedule-1", "form-1040"];

export const keilleScenario: Scenario = {
  name: "keille",
  description:
    "Single FL real estate professional: a crop-share farm rental loss she materially participated in (Form 4835 box 34a, line 34c), to Schedule E lines 40, 41 and 43 with no Form 8582.",
  verification: "unverified",
  taxYear: KEILLE_TAX_YEAR,
  userId: KEILLE_USER_ID,
  facts: keilleFacts,
  decisions: keilleDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: keilleExpected(formId),
    goldenPdfPath: lockedGoldenPath("keille", formId),
  })),
};
