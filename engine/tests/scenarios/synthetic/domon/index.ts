/*
 * Made-up taxpayer (README.md): a single full-year California resident with
 * ten electing entities' PTE elective tax credits, a carryover from 2024, and
 * tax paid to Colorado. No Schedule P (540) files: FTB 3804-CR line 4 is the
 * tax left after the other state tax credit, and Form 540 lines 43 and 44 take
 * the two credits. No answer key: the expected values are hand-checked, locked
 * engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { domonDecisions } from "./decisions.js";
import { domonExpected } from "./expected.js";
import { DOMON_TAX_YEAR, DOMON_USER_ID, domonFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-8959",
  "schedule-2",
  "form-1040",
  "schedule-ca",
  "schedule-s",
  "form-3804-cr",
  "form-540",
];

export const domonScenario: Scenario = {
  name: "domon",
  description:
    "Single San Diego filer with ten PTE elective tax credits, a 2024 carryover and Colorado tax: FTB 3804-CR limited by the tax left after the other state tax credit, Form 540 lines 43 and 44 with no Schedule P.",
  taxYear: DOMON_TAX_YEAR,
  userId: DOMON_USER_ID,
  verification: "unverified",
  facts: domonFacts,
  decisions: domonDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: domonExpected(formId),
    goldenPdfPath: lockedGoldenPath("domon", formId),
  })),
};
