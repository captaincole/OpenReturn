/*
 * A made-up married couple in Florida (README.md): two W-2s, an early 401(k)
 * distribution, joint interest, two children and joint estimated payments. The
 * joint refund will pay the husband's past-due child support, so the wife files
 * Form 8379 with the return. Federal only. UNVERIFIED: no answer key; the
 * expected values are engine output checked by hand, so a failure means "the
 * engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { erianDecisions } from "./decisions.js";
import { erianExpected } from "./expected.js";
import { ERIAN_TAX_YEAR, ERIAN_USER_ID, erianFacts } from "./facts.js";

const FORM_IDS = ["form-8379", "schedule-1", "schedule-2", "schedule-8812", "form-1040"];

export const erianScenario: Scenario = {
  name: "erian",
  description:
    "MFJ FL couple: the joint refund pays the husband's past-due child support, so the wife files Form 8379 (Parts I to III, every Part III line).",
  verification: "unverified",
  taxYear: ERIAN_TAX_YEAR,
  userId: ERIAN_USER_ID,
  facts: erianFacts,
  decisions: erianDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: erianExpected(formId),
    goldenPdfPath: lockedGoldenPath("erian", formId),
  })),
};
