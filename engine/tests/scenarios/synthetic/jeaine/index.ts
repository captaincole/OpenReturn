/*
 * A made-up single filer in California (README.md): a part-time W-2 and a
 * book restoration business with a self-only health policy under it. One
 * source of self-employment income and no long-term care, so no Form 7206
 * files: the Form 1040 worksheet's arithmetic puts the deduction on Schedule 1
 * line 17, and Schedule CA (540) line 17 column A copies it.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { jeaineDecisions } from "./decisions.js";
import { jeaineExpected } from "./expected.js";
import { JEAINE_TAX_YEAR, JEAINE_USER_ID, jeaineFacts } from "./facts.js";

const FORM_IDS = [
  "form-1040",
  "schedule-1",
  "schedule-2",
  "schedule-c",
  "schedule-se",
  "form-8995",
  "form-540",
  "schedule-ca",
];

export const jeaineScenario: Scenario = {
  name: "jeaine",
  description:
    "Single CA filer with a part-time W-2 and a business: one self-employment source and no long-term care, so the Form 1040 worksheet (no Form 7206) gives Schedule 1 line 17, copied to Schedule CA line 17 column A.",
  verification: "unverified",
  taxYear: JEAINE_TAX_YEAR,
  userId: JEAINE_USER_ID,
  facts: jeaineFacts,
  decisions: jeaineDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: jeaineExpected(formId),
    goldenPdfPath: lockedGoldenPath("jeaine", formId),
  })),
};
