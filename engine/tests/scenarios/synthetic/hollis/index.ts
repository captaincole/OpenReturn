/*
 * A made-up single filer in Texas (README.md): W-2 wages and two Form 1099-Bs
 * with section 1256 contracts (Form 6781 Part I), one gain and one loss.
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { hollisDecisions } from "./decisions.js";
import { hollisExpected } from "./expected.js";
import { HOLLIS_TAX_YEAR, HOLLIS_USER_ID, hollisFacts } from "./facts.js";

const FORM_IDS = ["form-6781", "schedule-d", "form-1040"];

export const hollisScenario: Scenario = {
  name: "hollis",
  description:
    "Single TX filer: a W-2 and two 1099-Bs with section 1256 futures, a gain and a loss (Form 6781 Part I, Schedule D lines 4 and 11).",
  verification: "unverified",
  taxYear: HOLLIS_TAX_YEAR,
  userId: HOLLIS_USER_ID,
  facts: hollisFacts,
  decisions: hollisDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: hollisExpected(formId),
    goldenPdfPath: lockedGoldenPath("hollis", formId),
  })),
};
