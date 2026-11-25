/*
 * A made-up married couple in Texas (README.md) with foreign accounts and
 * holdings over the Form 8938 threshold: three Part V accounts, two Part VI
 * assets, a fund reported on Form 8621 (Part IV), and Part III tied to the
 * income lines. Federal only. UNVERIFIED: no answer key; the expected values
 * are engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { amysDecisions } from "./decisions.js";
import { amysExpected } from "./expected.js";
import { AMYS_TAX_YEAR, AMYS_USER_ID, amysFacts } from "./facts.js";

const FORM_IDS = [
  "form-8938",
  "schedule-b",
  "form-8949",
  "schedule-d",
  "schedule-1",
  "schedule-3",
  "form-1040",
];

export const amysScenario: Scenario = {
  name: "amys",
  description:
    "MFJ TX filers with foreign accounts and holdings over the Form 8938 threshold: Parts I to VI, Part III tied to Schedules B, D, 1 and 3, and Schedule B line 7 from the account facts.",
  verification: "unverified",
  taxYear: AMYS_TAX_YEAR,
  userId: AMYS_USER_ID,
  facts: amysFacts,
  decisions: amysDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: amysExpected(formId),
    goldenPdfPath: lockedGoldenPath("amys", formId),
  })),
};
