/*
 * A made-up single partner in Texas (README.md): a W-2 and two Forms 8986
 * after BBA audits, four earlier years changed (Form 8978 with all four
 * columns, a penalty and interest), and the additional reporting year tax on
 * Form 1040 line 16, box 3. Federal only. UNVERIFIED: no answer key; the
 * expected values are engine output checked by hand, so a failure means "the
 * engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { vandeneDecisions } from "./decisions.js";
import { vandeneExpected } from "./expected.js";
import { VANDENE_TAX_YEAR, VANDENE_USER_ID, vandeneFacts } from "./facts.js";

const FORM_IDS = ["form-8978", "form-1040"];

export const vandeneScenario: Scenario = {
  name: "vandene",
  description:
    "Single TX partner: a W-2 and two Forms 8986 from BBA audits (Form 8978 with four columns, a penalty, interest at the short-term rate plus 5%; Form 1040 line 16 box 3).",
  verification: "unverified",
  taxYear: VANDENE_TAX_YEAR,
  userId: VANDENE_USER_ID,
  facts: vandeneFacts,
  decisions: vandeneDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: vandeneExpected(formId),
    goldenPdfPath: lockedGoldenPath("vandene", formId),
  })),
};
