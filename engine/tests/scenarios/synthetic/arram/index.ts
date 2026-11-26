/*
 * A made-up single filer in Texas (README.md): a W-2, a rental duplex with a
 * loss that Form 8582's special allowance allows, and passive credits from
 * three rental real estate activities with last year's unallowed credits.
 * Form 8582-CR uses Parts II, III and IV (the special allowances, the
 * modified AGI phaseouts and the tax on the allowance) and Worksheets 5 to 9;
 * Form 3800 takes the allowed credits on lines 3, 24 and 33. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked
 * by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { arramDecisions } from "./decisions.js";
import { arramExpected } from "./expected.js";
import { ARRAM_TAX_YEAR, ARRAM_USER_ID, arramFacts } from "./facts.js";

const FORM_IDS = [
  "schedule-e",
  "form-8582",
  "schedule-1",
  "form-8582-cr",
  "form-3800",
  "form-6251",
  "schedule-2",
  "schedule-3",
  "form-1040",
];

export const arramScenario: Scenario = {
  name: "arram",
  description:
    "Single TX filer: a W-2, a rental duplex with active participation, and passive credits from three rental real estate activities (Worksheets 1 to 3 of Form 8582-CR) with prior year unallowed credits; Form 8582-CR Parts II to V and Form 3800 lines 3, 24 and 33.",
  verification: "unverified",
  taxYear: ARRAM_TAX_YEAR,
  userId: ARRAM_USER_ID,
  facts: arramFacts,
  decisions: arramDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: arramExpected(formId),
    goldenPdfPath: lockedGoldenPath("arram", formId),
  })),
};
