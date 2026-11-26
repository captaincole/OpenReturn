/*
 * A made-up single walnut grower in Yuba City, California (README.md), born in
 * 1934, whose cannery pension paid out in 2025. She is a farmer for FTB 5805F
 * (two-thirds of her gross income is from farming), underpaid her one
 * estimated tax payment, and asks to waive part of the penalty: FTB 5805F
 * Parts I and II and Form 540 line 113 with its FTB 5805F box. UNVERIFIED: no
 * answer key; the expected values are engine output checked by hand.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { zerahDecisions } from "./decisions.js";
import { zerahExpected } from "./expected.js";
import { ZERAH_TAX_YEAR, ZERAH_USER_ID, zerahFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "schedule-f",
  "schedule-se",
  "schedule-1",
  "schedule-b",
  "schedule-1-a",
  "form-8995-a",
  "form-8960",
  "schedule-2",
  "form-1040",
  "schedule-ca",
  "schedule-g-1",
  "form-540",
  "form-5805f",
];

export const zerahScenario: Scenario = {
  name: "zerah",
  description:
    "Single Yuba City walnut grower born in 1934 with a lump-sum pension: FTB 5805F Parts I and II with a partial waiver, Schedule G-1 tax on line 2, and Form 540 line 113 with its FTB 5805F box.",
  taxYear: ZERAH_TAX_YEAR,
  userId: ZERAH_USER_ID,
  verification: "unverified",
  facts: zerahFacts,
  decisions: zerahDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: zerahExpected(formId),
    goldenPdfPath: lockedGoldenPath("zerah", formId),
  })),
};
