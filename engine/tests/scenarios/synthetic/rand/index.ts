/*
 * A made-up single filer in Washington (README.md): foreign tax on a mutual
 * fund, a Dutch stock and Australian bonds (passive category), and UK tax on the
 * wages of a London assignment (general category). Two Forms 1116, the
 * qualified dividend adjustment and the Worksheet for Line 18, and the credit
 * on Schedule 3 line 1. Federal only. UNVERIFIED: no answer key; the expected
 * values are engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { randDecisions } from "./decisions.js";
import { randExpected } from "./expected.js";
import { RAND_TAX_YEAR, RAND_USER_ID, randFacts } from "./facts.js";

const FORM_IDS = [
  "form-1116",
  "schedule-3",
  "form-1040",
  "schedule-1",
  "schedule-2",
  "schedule-a",
  "schedule-b",
  "form-8960",
];

export const randScenario: Scenario = {
  name: "rand",
  description:
    "Single WA filer with passive foreign tax (a fund, a Dutch stock, Australian bonds) and UK tax on wages: two Forms 1116 with the qualified dividend adjustment, and the credit on Schedule 3 line 1.",
  verification: "unverified",
  taxYear: RAND_TAX_YEAR,
  userId: RAND_USER_ID,
  facts: randFacts,
  decisions: randDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: randExpected(formId),
    goldenPdfPath: lockedGoldenPath("rand", formId),
  })),
};
