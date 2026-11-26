/*
 * A made-up self-employed engineer from California on a 12-month contract in
 * Portugal (README.md). Form 2555 Parts III, IV to IX: the physical presence
 * test for part of 2025, line 44 with the self-employment tax deduction, and
 * the housing deduction with a 2024 carryover. Schedule 1 lines 8d and 24j,
 * Schedule 1-A lines 2b and 2c, Schedule CA lines 8d and 24j. UNVERIFIED: no
 * answer key; the expected values are engine output checked by hand.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { romandaDecisions } from "./decisions.js";
import { romandaExpected } from "./expected.js";
import { ROMANDA_TAX_YEAR, ROMANDA_USER_ID, romandaFacts } from "./facts.js";

const FORM_IDS = [
  "form-2555",
  "schedule-b",
  "schedule-c",
  "schedule-se",
  "schedule-1",
  "schedule-1-a",
  "schedule-2",
  "form-8995",
  "form-1040",
  "schedule-ca",
  "form-540",
];

export const romandaScenario: Scenario = {
  name: "romanda",
  description:
    "Single CA resident abroad: a self-employed engineer physically present in Portugal from March 2025, rent in euros, a 2024 housing carryover (Form 2555 Parts III to IX, Schedule 1 lines 8d and 24j, Schedule 1-A lines 2b and 2c, Schedule CA lines 8d and 24j).",
  verification: "unverified",
  taxYear: ROMANDA_TAX_YEAR,
  userId: ROMANDA_USER_ID,
  facts: romandaFacts,
  decisions: romandaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: romandaExpected(formId),
    goldenPdfPath: lockedGoldenPath("romanda", formId),
  })),
};
