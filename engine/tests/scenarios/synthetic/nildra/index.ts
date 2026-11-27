/*
 * A made-up taxpayer (README.md): a single part-year resident who moved from
 * Portland, Oregon to San Diego on September 1, 2025, with three stock sales,
 * one with a higher California basis, and a California capital loss carryover
 * restated as if she had always been a resident. Schedule D (540NR) ends in a
 * California loss, so line 12a goes to Schedule CA (540NR) line 7a column B.
 * UNVERIFIED: no answer key; the expected values are engine output checked
 * by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { nildraDecisions } from "./decisions.js";
import { nildraExpected } from "./expected.js";
import { NILDRA_TAX_YEAR, NILDRA_USER_ID, nildraFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-8949",
  "schedule-d",
  "schedule-b",
  "form-1040",
  "schedule-d-540nr",
  "schedule-ca-540nr",
  "form-540nr",
];

export const nildraScenario: Scenario = {
  name: "nildra",
  description:
    "Single part-year resident who moved into California on September 1: a sale with a higher California basis and a restated California carryover; Schedule D (540NR) lines 1 to 12a and Schedule CA (540NR) line 7a column B.",
  taxYear: NILDRA_TAX_YEAR,
  userId: NILDRA_USER_ID,
  verification: "unverified",
  facts: nildraFacts,
  decisions: nildraDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: nildraExpected(formId),
    goldenPdfPath: lockedGoldenPath("nildra", formId),
  })),
};
