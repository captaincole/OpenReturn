/*
 * A made-up single filer in Nevada (README.md): a W-2 and a Schedule K-1
 * (Form 1041) from a family trust with interest, dividends (part qualified)
 * and box 14 code B foreign taxes over the election's $300 limit, so Form
 * 1116 files with the trust as its one source, from the trustee's foreign
 * income statement. Federal only. UNVERIFIED: no answer key; the expected
 * values are engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { thomDecisions } from "./decisions.js";
import { thomExpected } from "./expected.js";
import { THOM_TAX_YEAR, THOM_USER_ID, thomFacts } from "./facts.js";

const FORM_IDS = ["form-1116", "schedule-3", "schedule-b", "form-1040"];

export const thomScenario: Scenario = {
  name: "thom",
  description:
    "Single NV filer: a W-2 and a trust K-1 (Form 1041) with interest, dividends and box 14 code B foreign taxes over $300: Form 1116 with the trust as its source (the trustee's foreign income statement), and the credit on Schedule 3 line 1.",
  verification: "unverified",
  taxYear: THOM_TAX_YEAR,
  userId: THOM_USER_ID,
  facts: thomFacts,
  decisions: thomDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: thomExpected(formId),
    goldenPdfPath: lockedGoldenPath("thom", formId),
  })),
};
