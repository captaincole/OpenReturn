/*
 * A made-up single filer in Nevada (README.md): a W-2 refund split among three
 * accounts on Form 8888, the third taking what the first two leave, and the
 * box on Form 1040 line 35a. Federal only. UNVERIFIED: no answer key; the
 * expected values are engine output checked by hand, so a failure means "the
 * engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { moiraineDecisions } from "./decisions.js";
import { moiraineExpected } from "./expected.js";
import { MOIRAINE_TAX_YEAR, MOIRAINE_USER_ID, moiraineFacts } from "./facts.js";

const FORM_IDS = ["form-8888", "form-1040"];

export const moiraineScenario: Scenario = {
  name: "moiraine",
  description:
    "Single NV filer: a W-2 refund split among three accounts (Form 8888 lines 1–3 and 5, the third account takes the rest, Form 1040 line 35a box).",
  verification: "unverified",
  taxYear: MOIRAINE_TAX_YEAR,
  userId: MOIRAINE_USER_ID,
  facts: moiraineFacts,
  decisions: moiraineDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: moiraineExpected(formId),
    goldenPdfPath: lockedGoldenPath("moiraine", formId),
  })),
};
