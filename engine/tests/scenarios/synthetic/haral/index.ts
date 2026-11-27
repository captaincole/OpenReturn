/*
 * A made-up single filer in Florida (README.md): the sole owner of a
 * low-income housing building whose rehabilitation is in the 11th year of its
 * credit. Form 8609-A item B's rehabilitation box and the deferred first-year
 * credit (lines 16 to 18). Federal only. The credit goes to Form 8586, which
 * has no rules yet. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { haralDecisions } from "./decisions.js";
import { haralExpected } from "./expected.js";
import { HARAL_TAX_YEAR, HARAL_USER_ID, haralFacts } from "./facts.js";

const FORM_IDS = ["form-8609-a", "form-1040"];

export const haralScenario: Scenario = {
  name: "haral",
  description:
    "Single FL filer who owns a low-income housing building whose rehabilitation allocation is in the 11th year: the deferred first-year credit (Form 8609-A item B rehabilitation, lines 1–3, 5, 16–18).",
  verification: "unverified",
  taxYear: HARAL_TAX_YEAR,
  userId: HARAL_USER_ID,
  facts: haralFacts,
  decisions: haralDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: haralExpected(formId),
    goldenPdfPath: lockedGoldenPath("haral", formId),
  })),
};
