/*
 * A made-up single taxpayer in Long Beach, California (README.md): an S
 * corporation K-1 loss so large that her business losses pass the $313,000
 * threshold, so federal Form 461 and California's FTB 3461 each figure an
 * excess business loss. The K-1's business capital loss stays a business loss
 * for California (FTB 3461 line 11), so California holds back $3,000 more:
 * Schedule CA line 8p takes the federal amount out (column B) and adds the
 * California one (column C). UNVERIFIED: no answer key; the expected values
 * are engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { egeaninDecisions } from "./decisions.js";
import { egeaninExpected } from "./expected.js";
import { EGEANIN_TAX_YEAR, EGEANIN_USER_ID, egeaninFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "schedule-b",
  "schedule-c",
  "schedule-se",
  "form-7203",
  "schedule-e",
  "schedule-d",
  "form-461",
  "schedule-1",
  "schedule-2",
  "form-8959",
  "form-8960",
  "form-8995-a",
  "form-1040",
  "schedule-ca",
  "form-3461",
  "form-540",
];

export const egeaninScenario: Scenario = {
  name: "egeanin",
  description:
    "Single Long Beach filer: an S corporation K-1 loss passes the $313,000 threshold, so Form 461 and FTB 3461 each figure an excess business loss; the K-1's business capital loss stays in California's business loss (FTB 3461 line 11), and Schedule CA line 8p swaps the federal adjustment (column B) for the California one (column C).",
  verification: "unverified",
  taxYear: EGEANIN_TAX_YEAR,
  userId: EGEANIN_USER_ID,
  facts: egeaninFacts,
  decisions: egeaninDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: egeaninExpected(formId),
    goldenPdfPath: lockedGoldenPath("egeanin", formId),
  })),
};
