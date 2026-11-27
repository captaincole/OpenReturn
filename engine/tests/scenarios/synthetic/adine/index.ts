/*
 * A made-up single farmer in Texas (README.md): a big wheat year on Schedule
 * F, raised breeding cows sold on Form 4797, and Schedule J averaging
 * $100,000 of farm income (the cows' $24,000 gain in it) over 2022 to 2024.
 * Form 1040 line 16 takes Schedule J line 23. Federal only. UNVERIFIED: no
 * answer key; the expected values are engine output checked by hand, so a
 * failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { adineDecisions } from "./decisions.js";
import { adineExpected } from "./expected.js";
import { ADINE_TAX_YEAR, ADINE_USER_ID, adineFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
export const FORM_IDS = [
  "schedule-f",
  "form-4797",
  "schedule-d",
  "schedule-se",
  "schedule-1",
  "form-8995",
  "schedule-j",
  "schedule-2",
  "form-1040",
];

export const adineScenario: Scenario = {
  name: "adine",
  description:
    "Single TX farmer: Schedule J averages $100,000 of farm income with a $24,000 section 1231 gain (lines 2b, 8, 12, 16 at the base years' capital gain rates), and Form 1040 line 16 takes Schedule J line 23.",
  verification: "unverified",
  taxYear: ADINE_TAX_YEAR,
  userId: ADINE_USER_ID,
  facts: adineFacts,
  decisions: adineDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: adineExpected(formId),
    goldenPdfPath: lockedGoldenPath("adine", formId),
  })),
};
