/*
 * A made-up married couple in Nevada (README.md), the "next year" shape: an S
 * corporation K-1 with income, and an ordinary loss and a cash gift that the
 * basis limit held back in 2024. The 2025 basis allows all of them: Form 7203
 * Part III column (b), a "PYA" row and a "Yes" on Schedule E line 27, the
 * carried gift on Schedule A, and the carried qualified loss on Form 8995
 * line 3. Federal only. UNVERIFIED: no answer key; the expected values are
 * engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { garethDecisions } from "./decisions.js";
import { garethExpected } from "./expected.js";
import { GARETH_TAX_YEAR, GARETH_USER_ID, garethFacts } from "./facts.js";

const FORM_IDS = ["form-7203", "schedule-e", "schedule-a", "form-8995", "schedule-1", "form-1040"];

export const garethScenario: Scenario = {
  name: "gareth",
  description:
    "MFJ NV couple: an S corporation K-1 with income and a 2024 basis-limited ordinary loss and cash gift that the 2025 basis allows (Form 7203 column (b), Schedule E PYA row and line 27 Yes, Schedule A line 11, Form 8995 line 3).",
  verification: "unverified",
  taxYear: GARETH_TAX_YEAR,
  userId: GARETH_USER_ID,
  facts: garethFacts,
  decisions: garethDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: garethExpected(formId),
    goldenPdfPath: lockedGoldenPath("gareth", formId),
  })),
};
