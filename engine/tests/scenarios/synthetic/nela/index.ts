/*
 * A made-up single freight hauler in Texas (README.md) who makes agri-biodiesel
 * for her own trucks, and a Schedule K-1 (Form 1065) from a fiscal-year
 * biofuels partnership with box 15 code AC. Form 8864 every line an individual
 * fills, line A with a transfer election, Schedule C line 6 with line 9, Form
 * 6251 line 3 taking line 9 back, and Form 3800 lines 1l and 1ff. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { nelaDecisions } from "./decisions.js";
import { nelaExpected } from "./expected.js";
import { NELA_TAX_YEAR, NELA_USER_ID, nelaFacts } from "./facts.js";

const FORM_IDS = [
  "form-8864",
  "form-3800",
  "form-6251",
  "schedule-c",
  "schedule-se",
  "schedule-e",
  "form-8995-a",
  "schedule-1",
  "schedule-2",
  "schedule-3",
  "form-1040",
];

export const nelaScenario: Scenario = {
  name: "nela",
  description:
    "Single TX freight hauler who makes agri-biodiesel for her own trucks, with a transfer election, and a K-1 (Form 1065) code AC with a SAF part; Form 8864 lines A and 7 to 11, Schedule C line 6, Form 6251 line 3, Form 3800 lines 1l and 1ff.",
  verification: "unverified",
  taxYear: NELA_TAX_YEAR,
  userId: NELA_USER_ID,
  facts: nelaFacts,
  decisions: nelaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: nelaExpected(formId),
    goldenPdfPath: lockedGoldenPath("nela", formId),
  })),
};
