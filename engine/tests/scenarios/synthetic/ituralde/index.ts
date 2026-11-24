/*
 * A made-up single filer in Washington (README.md): two activities with
 * amounts not at risk, each on its own Form 6198. A partnership K-1's loss and
 * the loss the at-risk limit carried from 2024 are limited to the amount at
 * risk (Schedule E line 28 column (f), a "PYA" row); a Schedule C film
 * business's loss is limited on line 31. Federal only. UNVERIFIED: no answer
 * key; the expected values are engine output checked by hand, so a failure
 * means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { ituraldeDecisions } from "./decisions.js";
import { ituraldeExpected } from "./expected.js";
import { ITURALDE_TAX_YEAR, ITURALDE_USER_ID, ituraldeFacts } from "./facts.js";

const FORM_IDS = ["form-6198", "schedule-c", "schedule-e", "schedule-1", "form-8995", "form-1040"];

export const ituraldeScenario: Scenario = {
  name: "ituralde",
  description:
    "Single WA filer: Form 6198 for a partnership K-1 (a carried at-risk loss, Part III from last year's form) and a Schedule C film business (Parts II and III); the allowed losses on Schedule E column (i) with a PYA row and on Schedule C line 31.",
  verification: "unverified",
  taxYear: ITURALDE_TAX_YEAR,
  userId: ITURALDE_USER_ID,
  facts: ituraldeFacts,
  decisions: ituraldeDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: ituraldeExpected(formId),
    goldenPdfPath: lockedGoldenPath("ituralde", formId),
  })),
};
