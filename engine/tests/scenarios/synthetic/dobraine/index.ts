/*
 * A made-up single filer in Washington (README.md): a like-kind exchange of
 * business real property with section 1245 recapture (Form 8824 lines 21–25c),
 * reaching Form 4797 lines 5 and 16, Schedule D line 11 and Schedule 1 line 4.
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { dobraineDecisions } from "./decisions.js";
import { dobraineExpected } from "./expected.js";
import { DOBRAINE_TAX_YEAR, DOBRAINE_USER_ID, dobraineFacts } from "./facts.js";

const FORM_IDS = ["form-8824", "form-4797", "schedule-d", "schedule-1", "form-1040"];

export const dobraineScenario: Scenario = {
  name: "dobraine",
  description:
    "Single WA filer: a like-kind exchange of business real property for cash and property with section 1250, 1245 and intangible parts (Form 8824 lines 21–25c), on Form 4797 lines 5 and 16.",
  verification: "unverified",
  taxYear: DOBRAINE_TAX_YEAR,
  userId: DOBRAINE_USER_ID,
  facts: dobraineFacts,
  decisions: dobraineDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: dobraineExpected(formId),
    goldenPdfPath: lockedGoldenPath("dobraine", formId),
  })),
};
