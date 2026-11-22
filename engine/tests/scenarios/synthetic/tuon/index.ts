/*
 * A made-up single filer in Santa Rosa, California (README.md), born in 1934,
 * whose whole pension paid out in 2025. Schedule G-1 fills Parts I to III, its
 * tax goes to Form 540 line 34, and Schedule CA line 5b column B takes the
 * distribution out of California income. UNVERIFIED: no answer key; the
 * expected values are engine output checked by hand.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { tuonDecisions } from "./decisions.js";
import { tuonExpected } from "./expected.js";
import { TUON_TAX_YEAR, TUON_USER_ID, tuonFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "schedule-b",
  "schedule-1-a",
  "form-1040",
  "schedule-ca",
  "schedule-g-1",
  "form-540",
];

export const tuonScenario: Scenario = {
  name: "tuon",
  description:
    "Single Santa Rosa filer born in 1934: a lump-sum pension with a capital gain part and an annuity contract; Schedule G-1 Parts I to III, Form 540 line 34 and Schedule CA line 5b column B.",
  taxYear: TUON_TAX_YEAR,
  userId: TUON_USER_ID,
  verification: "unverified",
  facts: tuonFacts,
  decisions: tuonDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: tuonExpected(formId),
    goldenPdfPath: lockedGoldenPath("tuon", formId),
  })),
};
