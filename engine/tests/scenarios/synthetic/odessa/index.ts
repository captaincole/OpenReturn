/*
 * A made-up married couple in Nevada (README.md): two W-2s, two Form 1099-INTs
 * with savings bond interest, four bonds cashed and three education expense
 * rows (Form 8815 in the phase-out range, Schedule B line 3). Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { odessaDecisions } from "./decisions.js";
import { odessaExpected } from "./expected.js";
import { ODESSA_TAX_YEAR, ODESSA_USER_ID, odessaFacts } from "./facts.js";

const FORM_IDS = ["form-8815", "schedule-b", "schedule-1", "form-1040"];

export const odessaScenario: Scenario = {
  name: "odessa",
  description:
    "MFJ NV filers: savings bonds cashed for tuition, the exclusion in the phase-out range (Form 8815, Schedule B line 3).",
  verification: "unverified",
  taxYear: ODESSA_TAX_YEAR,
  userId: ODESSA_USER_ID,
  facts: odessaFacts,
  decisions: odessaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: odessaExpected(formId),
    goldenPdfPath: lockedGoldenPath("odessa", formId),
  })),
};
