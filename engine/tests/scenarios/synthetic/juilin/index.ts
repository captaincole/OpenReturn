/*
 * A made-up single taxpayer in Nevada (README.md): an S corporation K-1 loss
 * so large that the business losses pass the $313,000 threshold, so Form 461
 * figures an excess business loss and Schedule 1 line 8p adds it back. A
 * Schedule C profit, capital gain distributions, a rental house and a
 * royalty that are not a trade or business, and a business bad debt
 * recovery on Schedule 1 line 8z fill the other lines of Form 461. Federal
 * only. UNVERIFIED: no answer key; the expected values are engine output
 * checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { juilinDecisions } from "./decisions.js";
import { juilinExpected } from "./expected.js";
import { JUILIN_TAX_YEAR, JUILIN_USER_ID, juilinFacts } from "./facts.js";

const FORM_IDS = [
  "schedule-b",
  "schedule-c",
  "schedule-se",
  "form-7203",
  "schedule-e",
  "form-8582",
  "form-461",
  "schedule-1",
  "schedule-2",
  "form-8959",
  "form-8960",
  "form-8995-a",
  "form-1040",
];

export const juilinScenario: Scenario = {
  name: "juilin",
  description:
    "Single NV filer: an S corporation K-1 loss that, with the return's other business income, passes the $313,000 threshold, so Form 461 figures an excess business loss that Schedule 1 line 8p adds back; a Schedule C profit, capital gain distributions, a rental and a royalty that are not a trade or business, and a business recovery on line 8z (Form 461 line 8).",
  verification: "unverified",
  taxYear: JUILIN_TAX_YEAR,
  userId: JUILIN_USER_ID,
  facts: juilinFacts,
  decisions: juilinDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: juilinExpected(formId),
    goldenPdfPath: lockedGoldenPath("juilin", formId),
  })),
};
