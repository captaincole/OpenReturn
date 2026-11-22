/*
 * A made-up single filer in Florida (README.md): a member of the Armed Forces
 * whose W-2 code P moving reimbursement is more than the cost of a permanent
 * change of station move (Form 3903 line 5 No, the excess on Form 1040 line 1h).
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { corwinDecisions } from "./decisions.js";
import { corwinExpected } from "./expected.js";
import { CORWIN_TAX_YEAR, CORWIN_USER_ID, corwinFacts } from "./facts.js";

const FORM_IDS = ["form-3903", "form-1040"];

export const corwinScenario: Scenario = {
  name: "corwin",
  description:
    "Single FL filer in the Armed Forces: a W-2 box 12 code P reimbursement more than the cost of a permanent change of station move (Form 3903 line 5 No, the excess on Form 1040 line 1h).",
  verification: "unverified",
  taxYear: CORWIN_TAX_YEAR,
  userId: CORWIN_USER_ID,
  facts: corwinFacts,
  decisions: corwinDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: corwinExpected(formId),
    goldenPdfPath: lockedGoldenPath("corwin", formId),
  })),
};
