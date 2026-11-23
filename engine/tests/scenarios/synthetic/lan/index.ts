/*
 * A made-up married couple in Texas (README.md): one spouse's small Schedule C
 * business with self-employment tax, the other spouse's S corporation K-1 with
 * box 1 income only (nonpassive, no section 199A statement), one son. Taxable
 * income is 0. The K-1 income is in AGI (Schedule E Part II, Schedule 1 line
 * 5) and outside self-employment tax and earned income. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { lanDecisions } from "./decisions.js";
import { lanExpected } from "./expected.js";
import { LAN_TAX_YEAR, LAN_USER_ID, lanFacts } from "./facts.js";

const FORM_IDS = [
  "schedule-c",
  "schedule-se",
  "schedule-e",
  "form-8995",
  "schedule-1",
  "schedule-2",
  "schedule-eic",
  "schedule-8812",
  "form-1040",
];

export const lanScenario: Scenario = {
  name: "lan",
  description:
    "MFJ TX couple: a Schedule C with SE tax, an S corporation K-1 with box 1 income only (Schedule E Part II column (k), Schedule 1 line 5), one son; K-1 income in AGI but not in SE tax or EIC earned income.",
  verification: "unverified",
  taxYear: LAN_TAX_YEAR,
  userId: LAN_USER_ID,
  facts: lanFacts,
  decisions: lanDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: lanExpected(formId),
    goldenPdfPath: lockedGoldenPath("lan", formId),
  })),
};
