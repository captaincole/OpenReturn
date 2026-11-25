/*
 * A made-up married couple in Texas (README.md): a partnership K-1 loss of
 * $400,000 puts a loss of more than $156,500 on Form 461 line 5, so Form 461
 * files, but the net business loss is under the $626,000 joint threshold:
 * line 16 is positive, there is no excess business loss, and Schedule 1 line
 * 8p stays blank. A capital loss carryover puts a loss on line 3 that Part II
 * adds back on line 11. Federal only. UNVERIFIED: no answer key; the expected
 * values are engine output checked by hand, so a failure means "the engine
 * changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { androlDecisions } from "./decisions.js";
import { androlExpected } from "./expected.js";
import { ANDROL_TAX_YEAR, ANDROL_USER_ID, androlFacts } from "./facts.js";

const FORM_IDS = [
  "schedule-d",
  "schedule-e",
  "form-461",
  "schedule-1",
  "schedule-2",
  "form-8959",
  "form-8960",
  "form-1040",
];

export const androlScenario: Scenario = {
  name: "androl",
  description:
    "MFJ TX couple: a materially participating limited partner's K-1 (Form 1065) loss of $400,000, over $156,500 on Form 461 line 5 but under the $626,000 joint threshold, so Form 461 files with no excess business loss and Schedule 1 line 8p stays blank; a capital loss carryover on line 3 is added back on line 11.",
  verification: "unverified",
  taxYear: ANDROL_TAX_YEAR,
  userId: ANDROL_USER_ID,
  facts: androlFacts,
  decisions: androlDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: androlExpected(formId),
    goldenPdfPath: lockedGoldenPath("androl", formId),
  })),
};
