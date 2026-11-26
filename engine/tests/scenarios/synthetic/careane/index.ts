/*
 * A made-up married person in Texas who files separately (README.md): her and
 * her husband's community and separate items on Form 8958, with the Texas rule
 * for income from separate property, a part-community pension, self-employment
 * tax and withholding, and joint estimated tax divided by agreement. Federal
 * only. UNVERIFIED: no answer key; the expected values are engine output
 * checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { careaneDecisions } from "./decisions.js";
import { careaneExpected } from "./expected.js";
import { CAREANE_TAX_YEAR, CAREANE_USER_ID, careaneFacts } from "./facts.js";

const FORM_IDS = [
  "form-8958",
  "schedule-b",
  "schedule-c",
  "schedule-se",
  "form-8949",
  "schedule-d",
  "schedule-e",
  "form-8995",
  "schedule-1",
  "schedule-2",
  "form-1040",
];

export const careaneScenario: Scenario = {
  name: "careane",
  description:
    "MFS TX filer: Form 8958 with community and separate wages, interest, dividends, businesses, gains, pensions, royalties, self-employment tax, withholding and joint estimated tax.",
  verification: "unverified",
  taxYear: CAREANE_TAX_YEAR,
  userId: CAREANE_USER_ID,
  facts: careaneFacts,
  decisions: careaneDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: careaneExpected(formId),
    goldenPdfPath: lockedGoldenPath("careane", formId),
  })),
};
