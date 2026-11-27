/*
 * Made-up taxpayer (README.md): a single full-year California resident whose
 * machine shop has a site in the former Tustin Legacy LAMBRA. FTB 3807
 * apportions three quarters of the shop's income to the LAMBRA, limits her
 * hiring and sales or use tax credit carryovers to the tax on it, and Schedule
 * P (540) Section A2 limits them to the tax over TMT. Form 540 line 43 takes
 * the LAMBRA credit and line 44 the Utah credit. No answer key: the expected
 * values are hand-checked, locked engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { shemerinDecisions } from "./decisions.js";
import { shemerinExpected } from "./expected.js";
import { SHEMERIN_TAX_YEAR, SHEMERIN_USER_ID, shemerinFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "schedule-c",
  "schedule-se",
  "schedule-1",
  "schedule-2",
  "form-8995",
  "form-1040",
  "schedule-ca",
  "schedule-p",
  "schedule-s",
  "form-3807",
  "form-540",
];

export const shemerinScenario: Scenario = {
  name: "shemerin",
  description:
    "Single Tustin machine shop owner with LAMBRA hiring and sales or use tax credit carryovers: FTB 3807 Worksheet I and Schedule Z, Schedule P (540) Section A2 line 6, Form 540 line 43 with the Utah credit on line 44.",
  taxYear: SHEMERIN_TAX_YEAR,
  userId: SHEMERIN_USER_ID,
  verification: "unverified",
  facts: shemerinFacts,
  decisions: shemerinDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: shemerinExpected(formId),
    goldenPdfPath: lockedGoldenPath("shemerin", formId),
  })),
};
