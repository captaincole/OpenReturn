/*
 * A made-up married couple in Texas (README.md): two W-2s, one with adoption
 * benefits (box 12 code T), a 1099-INT, and three children on Form 8839.
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { wrenDecisions } from "./decisions.js";
import { wrenExpected } from "./expected.js";
import { WREN_TAX_YEAR, WREN_USER_ID, wrenFacts } from "./facts.js";

const FORM_IDS = ["form-8839", "schedule-3", "schedule-b", "form-8960", "schedule-2", "form-1040"];

export const wrenScenario: Scenario = {
  name: "wren",
  description:
    "MFJ TX filers adopting three children (special needs, foreign, not final): Form 8839 Parts II and III with both phase-outs, the refundable credit (1040 line 30), Schedule 3 line 6c and taxable benefits on 1040 line 1f.",
  verification: "unverified",
  taxYear: WREN_TAX_YEAR,
  userId: WREN_USER_ID,
  facts: wrenFacts,
  decisions: wrenDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: wrenExpected(formId),
    goldenPdfPath: lockedGoldenPath("wren", formId),
  })),
};
