/*
 * A made-up single filer in Texas (README.md): a high W-2, a passive
 * partnership K-1 with box 1 income and two box 15 credits, a low-income
 * housing credit and last year's unallowed credits. Form 8582-CR allows the
 * tax on the net passive income (line 6), the special allowance of Part IV
 * that has no income limit, and shares the rest by Worksheets 7 to 9; Form
 * 3800 takes the allowed credits on lines 24 and 33. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked
 * by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { beldeineDecisions } from "./decisions.js";
import { beldeineExpected } from "./expected.js";
import { BELDEINE_TAX_YEAR, BELDEINE_USER_ID, beldeineFacts } from "./facts.js";

const FORM_IDS = [
  "schedule-e",
  "schedule-1",
  "form-8582-cr",
  "form-3800",
  "form-6251",
  "schedule-2",
  "schedule-3",
  "form-8959",
  "form-8960",
  "form-1040",
];

export const beldeineScenario: Scenario = {
  name: "beldeine",
  description:
    "Single TX filer: a high W-2, a passive partnership K-1 with box 1 income and box 15 credits, a low-income housing credit and prior year unallowed credits; Form 8582-CR line 6 (tax on net passive income), Part IV with no income limit, Worksheets 7 to 9, and Form 3800 lines 24 and 33.",
  verification: "unverified",
  taxYear: BELDEINE_TAX_YEAR,
  userId: BELDEINE_USER_ID,
  facts: beldeineFacts,
  decisions: beldeineDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: beldeineExpected(formId),
    goldenPdfPath: lockedGoldenPath("beldeine", formId),
  })),
};
