/*
 * A made-up single filer in Texas (README.md): credit recapture on four
 * properties and a hydrogen facility, elective payment recaptures, excessive
 * payments, an excessive credit transfer and penalties (Form 4255), carried to
 * Schedule 2 lines 1d, 1e, 1f, 1y, 17a, 17z and 19. Federal only. UNVERIFIED:
 * no answer key; the expected values are engine output checked by hand, so a
 * failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { liandrinDecisions } from "./decisions.js";
import { liandrinExpected } from "./expected.js";
import { LIANDRIN_TAX_YEAR, LIANDRIN_USER_ID, liandrinFacts } from "./facts.js";

const FORM_IDS = ["form-4255", "schedule-2", "form-8959", "form-1040"];

export const liandrinScenario: Scenario = {
  name: "liandrin",
  description:
    "Single TX filer: Form 4255 recapture (rehabilitation, energy, advanced manufacturing, emissions tier, prevailing wage), excessive payments, an excessive credit transfer and penalties, on Schedule 2 lines 1d–1f, 1y, 17a, 17z and 19.",
  verification: "unverified",
  taxYear: LIANDRIN_TAX_YEAR,
  userId: LIANDRIN_USER_ID,
  facts: liandrinFacts,
  decisions: liandrinDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: liandrinExpected(formId),
    goldenPdfPath: lockedGoldenPath("liandrin", formId),
  })),
};
