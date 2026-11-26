/*
 * A made-up taxpayer (README.md): a single San Jose resident with two rentals
 * (net passive income) and California research, orphan drug and low-income
 * housing credits from passive activities. FTB 3801-CR lines 1a to 17 but
 * line 13 and lines 2a to 2c; Schedule P (540) Section B2 lines 16 to 18;
 * Form 540 line 45. No answer key: the expected values are hand-checked,
 * locked engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { kirunaDecisions } from "./decisions.js";
import { kirunaExpected } from "./expected.js";
import { KIRUNA_TAX_YEAR, KIRUNA_USER_ID, kirunaFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "schedule-e",
  "form-8582",
  "schedule-1",
  "form-1040",
  "form-3801",
  "schedule-ca",
  "schedule-p",
  "form-3801-cr",
  "form-540",
];

export const kirunaScenario: Scenario = {
  name: "kiruna",
  description:
    "Single San Jose filer with two rentals and California passive credits (research, orphan drug carryover, low-income housing): FTB 3801-CR Parts I to III, Schedule P (540) lines 16 to 18, Form 540 line 45.",
  taxYear: KIRUNA_TAX_YEAR,
  userId: KIRUNA_USER_ID,
  verification: "unverified",
  facts: kirunaFacts,
  decisions: kirunaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: kirunaExpected(formId),
    goldenPdfPath: lockedGoldenPath("kiruna", formId),
  })),
};
