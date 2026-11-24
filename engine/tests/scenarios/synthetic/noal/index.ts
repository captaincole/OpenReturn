/*
 * Made-up taxpayers (README.md): a married couple filing jointly, full-year
 * California residents, with two rental homes and a passive royalty. FTB 3801
 * limits their California passive loss (line 3 is a loss, Parts II, VI, VII
 * and VIII), and its Schedule E worksheet goes to Schedule CA (540) line 5
 * column C. No answer key: the expected values are hand-checked, locked engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { noalDecisions } from "./decisions.js";
import { noalExpected } from "./expected.js";
import { NOAL_TAX_YEAR, NOAL_USER_ID, noalFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "schedule-e",
  "form-8582",
  "schedule-1",
  "form-1040",
  "form-3885a",
  "form-3801",
  "schedule-ca",
  "form-540",
];

export const noalScenario: Scenario = {
  name: "noal",
  description:
    "MFJ Sacramento couple: two W-2s, two rental homes (one with a California depreciation difference and a carryover in Part V) and a passive royalty; FTB 3801 with a loss on line 3 and Schedule CA line 5 column C.",
  taxYear: NOAL_TAX_YEAR,
  userId: NOAL_USER_ID,
  verification: "unverified",
  facts: noalFacts,
  decisions: noalDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: noalExpected(formId),
    goldenPdfPath: lockedGoldenPath("noal", formId),
  })),
};
