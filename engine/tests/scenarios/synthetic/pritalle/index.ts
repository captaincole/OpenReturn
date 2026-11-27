/*
 * A made-up taxpayer (README.md): a single part-year resident who moved from
 * Sacramento to Austin, Texas on June 30, 2025, with wages from both jobs,
 * credit union interest and a March stock sale. Form 540NR and Schedule CA
 * (540NR): the tax on total taxable income times the California ratio.
 * UNVERIFIED: no answer key; the expected values are engine output checked
 * by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { pritalleDecisions } from "./decisions.js";
import { pritalleExpected } from "./expected.js";
import { PRITALLE_TAX_YEAR, PRITALLE_USER_ID, pritalleFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = ["form-8949", "schedule-d", "form-1040", "schedule-ca-540nr", "form-540nr"];

export const pritalleScenario: Scenario = {
  name: "pritalle",
  description:
    "Single part-year resident who moved out of California on June 30: two W-2s, interest and a capital gain; Schedule CA (540NR) Parts I, II and IV and Form 540NR lines 12 to 125.",
  taxYear: PRITALLE_TAX_YEAR,
  userId: PRITALLE_USER_ID,
  verification: "unverified",
  facts: pritalleFacts,
  decisions: pritalleDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: pritalleExpected(formId),
    goldenPdfPath: lockedGoldenPath("pritalle", formId),
  })),
};
