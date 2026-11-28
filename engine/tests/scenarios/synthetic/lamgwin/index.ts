/*
 * A made-up single filer in Texas (README.md): six qualified equity
 * investments in community development entities with a 2025 credit allowance
 * date (credit years 1 to 5 and 7), a seventh whose credit period ended in 2024, and a
 * K-1 new markets credit. Form 8874 lines 1 to 3, Form 3800 line 1i. Federal
 * only. UNVERIFIED: no answer key; the expected values are engine output
 * checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { lamgwinDecisions } from "./decisions.js";
import { lamgwinExpected } from "./expected.js";
import { LAMGWIN_TAX_YEAR, LAMGWIN_USER_ID, lamgwinFacts } from "./facts.js";

const FORM_IDS = [
  "form-8874",
  "schedule-e",
  "form-3800",
  "form-6251",
  "form-8959",
  "schedule-1",
  "schedule-2",
  "schedule-3",
  "form-1040",
];

export const lamgwinScenario: Scenario = {
  name: "lamgwin",
  description:
    "Single TX filer with six qualified equity investments in community development entities (credit years 1 to 7, 5% and 6%), one whose credit period ended in 2024, and a K-1 new markets credit (Form 8874 lines 1–3, Form 3800 line 1i).",
  verification: "unverified",
  taxYear: LAMGWIN_TAX_YEAR,
  userId: LAMGWIN_USER_ID,
  facts: lamgwinFacts,
  decisions: lamgwinDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: lamgwinExpected(formId),
    goldenPdfPath: lockedGoldenPath("lamgwin", formId),
  })),
};
