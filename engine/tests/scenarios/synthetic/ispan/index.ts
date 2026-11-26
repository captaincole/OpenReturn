/*
 * A made-up single filer in Nevada (README.md): a landscape design business, a
 * health and dental policy under it, a long-term care contract and a SEP-IRA.
 * Form 7206 files (the long-term care premiums), and its line 14 reaches
 * Schedule 1 line 17 and the business's QBI on Form 8995. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { ispanDecisions } from "./decisions.js";
import { ispanExpected } from "./expected.js";
import { ISPAN_TAX_YEAR, ISPAN_USER_ID, ispanFacts } from "./facts.js";

const FORM_IDS = [
  "form-7206",
  "form-1040",
  "schedule-1",
  "schedule-2",
  "schedule-c",
  "schedule-se",
  "form-8995",
];

export const ispanScenario: Scenario = {
  name: "ispan",
  description:
    "Single NV landscape architect: Form 7206 with health and long-term care premiums and a SEP-IRA, line 14 on Schedule 1 line 17 and off the business's QBI (Form 8995).",
  verification: "unverified",
  taxYear: ISPAN_TAX_YEAR,
  userId: ISPAN_USER_ID,
  facts: ispanFacts,
  decisions: ispanDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: ispanExpected(formId),
    goldenPdfPath: lockedGoldenPath("ispan", formId),
  })),
};
