/*
 * A made-up single filer in Texas (README.md): a seasonal business, a
 * part-year W-2, an early IRA withdrawal, itemized deductions, the American
 * opportunity credit, and estimated tax paid late in the year. Form 2210 with
 * Schedule AI (box C) puts the penalty on Form 1040 line 38. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { bashereDecisions } from "./decisions.js";
import { bashereExpected } from "./expected.js";
import { BASHERE_TAX_YEAR, BASHERE_USER_ID, bashereFacts } from "./facts.js";

const FORM_IDS = [
  "form-2210",
  "form-1040",
  "schedule-1",
  "schedule-2",
  "schedule-3",
  "schedule-a",
  "schedule-c",
  "schedule-se",
  "form-8995",
  "form-8863",
];

export const bashereScenario: Scenario = {
  name: "bashere",
  description:
    "Single TX filer with a seasonal business: Form 2210 with Schedule AI and its Part II (box C), estimated tax by date, the penalty on Form 1040 lines 37 and 38.",
  verification: "unverified",
  taxYear: BASHERE_TAX_YEAR,
  userId: BASHERE_USER_ID,
  facts: bashereFacts,
  decisions: bashereDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: bashereExpected(formId),
    goldenPdfPath: lockedGoldenPath("bashere", formId),
  })),
};
