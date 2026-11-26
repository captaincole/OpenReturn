/*
 * A made-up single filer in Nevada (README.md): the owner of a low-income
 * housing building whose qualified basis fell in 2025. Form 8611 lines 1 to 7
 * and 9 to 14 with the Line 2 Worksheet, and Schedule 2 line 16. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { pedronDecisions } from "./decisions.js";
import { pedronExpected } from "./expected.js";
import { PEDRON_TAX_YEAR, PEDRON_USER_ID, pedronFacts } from "./facts.js";

const FORM_IDS = ["form-8611", "schedule-2", "form-1040"];

export const pedronScenario: Scenario = {
  name: "pedron",
  description:
    "Single NV filer who owns a low-income housing building: the qualified basis fell below its first-year amount in year 8 (Form 8611 lines 1–7 and 9–14 with the Line 2 Worksheet, Schedule 2 line 16).",
  verification: "unverified",
  taxYear: PEDRON_TAX_YEAR,
  userId: PEDRON_USER_ID,
  facts: pedronFacts,
  decisions: pedronDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: pedronExpected(formId),
    goldenPdfPath: lockedGoldenPath("pedron", formId),
  })),
};
