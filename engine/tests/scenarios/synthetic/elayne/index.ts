/*
 * A made-up married couple in Texas (README.md): a new electric SUV and a used
 * electric hatchback, both placed in service in 2025, with no credit
 * transferred. Form 8936 Parts I, III and IV: 2025 modified AGI over the Part IV
 * limit, 2024 under it, so both credits stand; Schedule 3 lines 6f and 6m.
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { elayneDecisions } from "./decisions.js";
import { elayneExpected } from "./expected.js";
import { ELAYNE_TAX_YEAR, ELAYNE_USER_ID, elayneFacts } from "./facts.js";

const FORM_IDS = ["form-8936", "schedule-3", "form-1040"];

export const elayneScenario: Scenario = {
  name: "elayne",
  description:
    "MFJ TX couple: a new clean vehicle and a previously owned one, no transfer (Form 8936 Parts I, III, IV; 2025 MAGI over the Part IV limit, 2024 under; Schedule 3 lines 6f and 6m).",
  verification: "unverified",
  taxYear: ELAYNE_TAX_YEAR,
  userId: ELAYNE_USER_ID,
  facts: elayneFacts,
  decisions: elayneDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: elayneExpected(formId),
    goldenPdfPath: lockedGoldenPath("elayne", formId),
  })),
};
