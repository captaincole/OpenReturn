/*
 * A made-up single filer in Washington (README.md) who holds one qualified
 * school construction bond that no information return reports. Its credit is
 * her only interest, under $1,500, so Schedule B does not file and Form 1040
 * line 2b takes the credit itself. Federal only. UNVERIFIED: no answer key.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { yukiriDecisions } from "./decisions.js";
import { yukiriExpected } from "./expected.js";
import { YUKIRI_TAX_YEAR, YUKIRI_USER_ID, yukiriFacts } from "./facts.js";

const FORM_IDS = ["form-8912", "schedule-3", "form-1040"];

export const yukiriScenario: Scenario = {
  name: "yukiri",
  description:
    "Single WA filer with one QSCB held all year and no information return: the credit is Form 1040 line 2b interest without Schedule B, and Schedule 3 line 6k.",
  verification: "unverified",
  taxYear: YUKIRI_TAX_YEAR,
  userId: YUKIRI_USER_ID,
  facts: yukiriFacts,
  decisions: yukiriDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: yukiriExpected(formId),
    goldenPdfPath: lockedGoldenPath("yukiri", formId),
  })),
};
