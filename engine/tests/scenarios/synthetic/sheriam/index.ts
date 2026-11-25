/*
 * A made-up married couple in Florida (README.md) with three foreign funds:
 * a QEF elected this year with a section 1.1411-10(g) election, a section
 * 1291 fund sold at a gain, and a fund marked to market with a year-end loss
 * over its unreversed inclusions. Form 8621 (three copies) and the lines that
 * take its results. Federal only. UNVERIFIED: no answer key; the expected
 * values are engine output checked by hand.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { sheriamDecisions } from "./decisions.js";
import { sheriamExpected } from "./expected.js";
import { SHERIAM_TAX_YEAR, SHERIAM_USER_ID, sheriamFacts } from "./facts.js";

const FORM_IDS = [
  "form-8621",
  "schedule-1",
  "schedule-2",
  "schedule-d",
  "form-8959",
  "form-8960",
  "form-1040",
];

export const sheriamScenario: Scenario = {
  name: "sheriam",
  description:
    "MFJ FL couple with three PFICs: a QEF elected this year with a section 1.1411-10(g) election, a section 1291 fund sold at a gain (line 16), a mark-to-market ETF with a year-end loss limited by unreversed inclusions (Form 8621, Schedules 1, 2, D, Form 8960).",
  verification: "unverified",
  taxYear: SHERIAM_TAX_YEAR,
  userId: SHERIAM_USER_ID,
  facts: sheriamFacts,
  decisions: sheriamDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: sheriamExpected(formId),
    goldenPdfPath: lockedGoldenPath("sheriam", formId),
  })),
};
