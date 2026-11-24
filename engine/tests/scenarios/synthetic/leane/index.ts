/*
 * A made-up single taxpayer in Texas (README.md) with three foreign funds:
 * a section 1291 fund in euros with an excess distribution, a fund marked to
 * market with a partial sale, and a QEF with two earlier section 1294
 * elections. Form 8621 (three copies) and the lines that take its results.
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { leaneDecisions } from "./decisions.js";
import { leaneExpected } from "./expected.js";
import { LEANE_TAX_YEAR, LEANE_USER_ID, leaneFacts } from "./facts.js";

const FORM_IDS = [
  "form-8621",
  "schedule-1",
  "schedule-2",
  "schedule-b",
  "schedule-d",
  "schedule-3",
  "form-1116",
  "form-8959",
  "form-8960",
  "form-1040",
];

export const leaneScenario: Scenario = {
  name: "leane",
  description:
    "Single TX filer with three PFICs: a section 1291 fund in euros (excess distribution, line 16 tax and interest, foreign tax credit), a mark-to-market ETF with a partial sale, a QEF with section 1294 elections (Form 8621, Schedules 1, 2, B, D, Form 8960, Form 1116).",
  verification: "unverified",
  taxYear: LEANE_TAX_YEAR,
  userId: LEANE_USER_ID,
  facts: leaneFacts,
  decisions: leaneDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: leaneExpected(formId),
    goldenPdfPath: lockedGoldenPath("leane", formId),
  })),
};
