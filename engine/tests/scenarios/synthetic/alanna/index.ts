/*
 * A made-up single filer in Florida (README.md): a lawn care business retires
 * seven pieces of equipment. Five sell at a gain (Part III, which has four
 * columns), so Form 4797 files a second copy. Federal only. UNVERIFIED: no
 * answer key; the expected values are engine output checked by hand, so a
 * failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { alannaDecisions } from "./decisions.js";
import { alannaExpected } from "./expected.js";
import { ALANNA_TAX_YEAR, ALANNA_USER_ID, alannaFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-4797",
  "schedule-c",
  "schedule-se",
  "form-8995",
  "schedule-1",
  "schedule-2",
  "form-1040",
];

export const alannaScenario: Scenario = {
  name: "alanna",
  description:
    "Single FL filer: a lawn care business retires seven pieces of equipment; five Part III properties need a second Form 4797 (Schedule 1 line 4, the business's QBI on Form 8995).",
  verification: "unverified",
  taxYear: ALANNA_TAX_YEAR,
  userId: ALANNA_USER_ID,
  facts: alannaFacts,
  decisions: alannaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: alannaExpected(formId),
    goldenPdfPath: lockedGoldenPath("alanna", formId),
  })),
};
