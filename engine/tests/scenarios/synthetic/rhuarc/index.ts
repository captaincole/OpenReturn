/*
 * A made-up single filer in California (README.md): an Army Reserve member who
 * drives to drills more than 100 miles away on the standard mileage rate. The
 * unit's allowance is more than his mileage and lodging (the excess on Form
 * 1040 line 1a) and pays nothing toward meals, so Form 2106 line 10 is his
 * meals at 50%: Schedule 1 line 12 and Schedule CA (540) line 12 column A.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { rhuarcDecisions } from "./decisions.js";
import { rhuarcExpected } from "./expected.js";
import { RHUARC_TAX_YEAR, RHUARC_USER_ID, rhuarcFacts } from "./facts.js";

const FORM_IDS = ["form-2106", "schedule-1", "form-1040", "schedule-ca", "form-540"];

export const rhuarcScenario: Scenario = {
  name: "rhuarc",
  description:
    "Single CA filer, an Army Reserve member: Form 2106 on the standard mileage rate, an allowance over the column A expenses (Form 1040 line 1a), meals to Schedule 1 line 12 and Schedule CA line 12.",
  verification: "unverified",
  taxYear: RHUARC_TAX_YEAR,
  userId: RHUARC_USER_ID,
  facts: rhuarcFacts,
  decisions: rhuarcDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: rhuarcExpected(formId),
    goldenPdfPath: lockedGoldenPath("rhuarc", formId),
  })),
};
