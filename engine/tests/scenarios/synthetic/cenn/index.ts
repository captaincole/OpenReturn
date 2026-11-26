/*
 * A made-up single filer in Fresno (README.md): an accumulation distribution
 * from a trust that filed Form 541 and paid the California tax, thrown back to
 * five years, one before age 21, one under the multiple trust rule and one
 * under 25% of the average (FTB 5870A Part I; Form 540 line 34). UNVERIFIED:
 * no answer key; the expected values are engine output checked by hand, so a
 * failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { cennDecisions } from "./decisions.js";
import { cennExpected } from "./expected.js";
import { CENN_TAX_YEAR, CENN_USER_ID, cennFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = ["form-1040", "schedule-ca", "form-5870a", "form-540"];

export const cennScenario: Scenario = {
  name: "cenn",
  description:
    "Single Fresno filer: a Schedule J (541) accumulation distribution thrown back to five years, one before age 21, one under the multiple trust rule and one under a quarter of the average (FTB 5870A Part I, Form 540 line 34).",
  verification: "unverified",
  taxYear: CENN_TAX_YEAR,
  userId: CENN_USER_ID,
  facts: cennFacts,
  decisions: cennDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: cennExpected(formId),
    goldenPdfPath: lockedGoldenPath("cenn", formId),
  })),
};
