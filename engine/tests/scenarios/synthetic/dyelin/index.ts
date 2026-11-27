/*
 * A made-up couple in Alaska (README.md): a commercial fisher who married in
 * 2025, so the joint 2025 return follows two 2024 separate returns (Form 2210-F
 * box B). A payment in February 2026 covers the underpayment and leaves a
 * refund: the penalty on Form 1040 line 38 comes out of line 35a. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { dyelinDecisions } from "./decisions.js";
import { dyelinExpected } from "./expected.js";
import { DYELIN_TAX_YEAR, DYELIN_USER_ID, dyelinFacts } from "./facts.js";

const FORM_IDS = [
  "form-2210-f",
  "form-1040",
  "schedule-1",
  "schedule-2",
  "schedule-c",
  "schedule-se",
  "form-8995",
];

export const dyelinScenario: Scenario = {
  name: "dyelin",
  description:
    "MFJ AK commercial fisher married in 2025 (two 2024 separate returns): Form 2210-F box B, line 14 from a February 2026 payment, the penalty on Form 1040 line 38 taken out of the line 35a refund; Form 2210 does not file.",
  verification: "unverified",
  taxYear: DYELIN_TAX_YEAR,
  userId: DYELIN_USER_ID,
  facts: dyelinFacts,
  decisions: dyelinDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: dyelinExpected(formId),
    goldenPdfPath: lockedGoldenPath("dyelin", formId),
  })),
};
