/*
 * Riley (README.md): a made-up single filer in Nevada, under 59½, with one W-2
 * and two early 401(k) distributions. An exception covers part of each, so
 * Form 5329 Part I files with exception 99. Federal only.
 * UNVERIFIED: no outside answer key; the values are hand-checked engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { rileyDecisions } from "./decisions.js";
import { rileyExpected } from "./expected.js";
import { RILEY_TAX_YEAR, RILEY_USER_ID, rileyFacts } from "./facts.js";

const FORM_IDS = ["form-5329", "schedule-2", "form-1040"];

export const rileyScenario: Scenario = {
  name: "riley",
  description:
    "Single NV filer under 59½: W-2, two early 401(k) 1099-Rs, exceptions 23 and 05 cover part (Form 5329 Part I, exception 99).",
  verification: "unverified",
  taxYear: RILEY_TAX_YEAR,
  userId: RILEY_USER_ID,
  facts: rileyFacts,
  decisions: rileyDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: rileyExpected(formId),
    goldenPdfPath: lockedGoldenPath("riley", formId),
  })),
};
