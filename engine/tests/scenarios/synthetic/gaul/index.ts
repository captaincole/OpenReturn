/*
 * A made-up single filer in Texas (README.md): a like-kind exchange of
 * investment land with his brother (Parts I–III of Form 8824) and a section 1043
 * conflict-of-interest sale (Part IV), reaching Schedule D lines 4 and 11.
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { gaulDecisions } from "./decisions.js";
import { gaulExpected } from "./expected.js";
import { GAUL_TAX_YEAR, GAUL_USER_ID, gaulFacts } from "./facts.js";

const FORM_IDS = ["form-8824", "schedule-d", "form-1040"];

export const gaulScenario: Scenario = {
  name: "gaul",
  description:
    "Single TX filer: a related party like-kind exchange of investment land with cash, liabilities and other property (Form 8824 Parts I–III) and a conflict-of-interest sale (Part IV), on Schedule D lines 4 and 11.",
  verification: "unverified",
  taxYear: GAUL_TAX_YEAR,
  userId: GAUL_USER_ID,
  facts: gaulFacts,
  decisions: gaulDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: gaulExpected(formId),
    goldenPdfPath: lockedGoldenPath("gaul", formId),
  })),
};
