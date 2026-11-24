/*
 * Made-up taxpayer (README.md): a single full-year California resident who paid
 * nonresident tax to New York and Illinois on wages. Two Schedules S (one per
 * state); she itemizes, so Schedule P (540) Section B3 line 20 limits the credit
 * and Form 540 line 43 takes its column (b). No answer key: the expected values
 * are hand-checked, locked engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { morgaseDecisions } from "./decisions.js";
import { morgaseExpected } from "./expected.js";
import { MORGASE_TAX_YEAR, MORGASE_USER_ID, morgaseFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-8959",
  "schedule-2",
  "schedule-a",
  "form-1040",
  "schedule-ca",
  "schedule-s",
  "schedule-p",
  "form-540",
];

export const morgaseScenario: Scenario = {
  name: "morgase",
  description:
    "Single San Jose filer with New York and Illinois nonresident tax on wages: two Schedules S, Schedule P (540) line 20 and Form 540 line 43.",
  taxYear: MORGASE_TAX_YEAR,
  userId: MORGASE_USER_ID,
  verification: "unverified",
  facts: morgaseFacts,
  decisions: morgaseDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: morgaseExpected(formId),
    goldenPdfPath: lockedGoldenPath("morgase", formId),
  })),
};
