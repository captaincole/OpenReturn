/*
 * A made-up married couple in Texas (README.md): two W-2s, a little bank
 * interest, and a Schedule K-1 (Form 1041) from a family trust with interest,
 * dividends, a long-term gain and section 199A dividends, so the trust's items
 * join Schedule B, Schedule D and Form 8995 next to the couple's own. Federal
 * only. UNVERIFIED: no answer key; the expected values are engine output
 * checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { matDecisions } from "./decisions.js";
import { matExpected } from "./expected.js";
import { MAT_TAX_YEAR, MAT_USER_ID, matFacts } from "./facts.js";

const FORM_IDS = ["schedule-b", "schedule-d", "form-8995", "form-1040"];

export const matScenario: Scenario = {
  name: "mat",
  description:
    "MFJ TX couple: two W-2s, a 1099-INT, a trust K-1 (Form 1041) with interest, ordinary and qualified dividends, a net long-term gain and box 14 code I section 199A dividends (Schedule B rows, Schedule D line 12, Form 8995 line 6, the qualified dividends worksheet).",
  verification: "unverified",
  taxYear: MAT_TAX_YEAR,
  userId: MAT_USER_ID,
  facts: matFacts,
  decisions: matDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: matExpected(formId),
    goldenPdfPath: lockedGoldenPath("mat", formId),
  })),
};
