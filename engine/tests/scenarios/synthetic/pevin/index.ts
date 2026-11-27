/*
 * A made-up taxpayer (README.md): a single part-year resident who moved from
 * San Jose to Reno, Nevada on September 30, 2025, after she exercised
 * incentive stock options in June. She itemizes. Schedule P (540NR): the
 * minimum tax on total AMTI, at its average rate, on the California part.
 * UNVERIFIED: no answer key; the expected values are engine output checked
 * by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { pevinDecisions } from "./decisions.js";
import { pevinExpected } from "./expected.js";
import { PEVIN_TAX_YEAR, PEVIN_USER_ID, pevinFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "schedule-a",
  "schedule-b",
  "form-6251",
  "form-8959",
  "form-8960",
  "schedule-2",
  "form-1040",
  "schedule-ca-540nr",
  "form-540nr",
  "schedule-p-540nr",
];

export const pevinScenario: Scenario = {
  name: "pevin",
  description:
    "Single part-year resident who moved out of California on September 30 after an ISO exercise, itemizing: Schedule P (540NR) Parts I to III and Form 540NR lines 63, 71 and 74.",
  taxYear: PEVIN_TAX_YEAR,
  userId: PEVIN_USER_ID,
  verification: "unverified",
  facts: pevinFacts,
  decisions: pevinDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: pevinExpected(formId),
    goldenPdfPath: lockedGoldenPath("pevin", formId),
  })),
};
