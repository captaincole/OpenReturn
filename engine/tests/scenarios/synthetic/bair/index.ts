/*
 * A made-up U.S. citizen on assignment in London (README.md): a W-2 from his
 * U.S. employer, allowances, rent paid in pounds. Form 2555 Parts I, II and IV
 * to VIII with the housing exclusion, the Foreign Earned Income Tax Worksheet
 * on Form 1040 line 16, and the exclusions added back on Schedules 1-A and
 * 8812 and Form 8960. Federal only. UNVERIFIED: no answer key; the expected
 * values are engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { bairDecisions } from "./decisions.js";
import { bairExpected } from "./expected.js";
import { BAIR_TAX_YEAR, BAIR_USER_ID, bairFacts } from "./facts.js";

const FORM_IDS = [
  "form-2555",
  "schedule-b",
  "schedule-1",
  "schedule-1-a",
  "schedule-2",
  "schedule-8812",
  "form-8959",
  "form-8960",
  "form-1040",
];

export const bairScenario: Scenario = {
  name: "bair",
  description:
    "HOH U.S. citizen abroad: a bona fide resident of the UK with a W-2 from a U.S. employer, allowances and rent in pounds (Form 2555 with the housing exclusion, the Foreign Earned Income Tax Worksheet, Schedule 1 line 8d, Schedules 1-A and 8812 line 2b, Form 8960 line 13).",
  verification: "unverified",
  taxYear: BAIR_TAX_YEAR,
  userId: BAIR_USER_ID,
  facts: bairFacts,
  decisions: bairDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: bairExpected(formId),
    goldenPdfPath: lockedGoldenPath("bair", formId),
  })),
};
