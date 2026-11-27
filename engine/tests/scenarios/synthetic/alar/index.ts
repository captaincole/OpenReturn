/*
 * A made-up single filer in Nevada (README.md): the sole owner of a
 * low-income housing building whose qualified basis decreased in 2025, and a
 * limited partner with a low-income housing credit on a K-1. Form 8586 lines 1
 * to 5, Form 3800 line 4d with two rows, Form 8582-CR Part IV. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { alarDecisions } from "./decisions.js";
import { alarExpected } from "./expected.js";
import { ALAR_TAX_YEAR, ALAR_USER_ID, alarFacts } from "./facts.js";

const FORM_IDS = [
  "form-8609-a",
  "form-8586",
  "schedule-e",
  "form-8582-cr",
  "form-3800",
  "form-8959",
  "schedule-1",
  "schedule-2",
  "schedule-3",
  "form-1040",
];

export const alarScenario: Scenario = {
  name: "alar",
  description:
    "Single NV filer who owns a low-income housing building whose basis decreased in 2025 and holds a K-1 low-income housing credit (Form 8586 lines 1–5, Form 3800 line 4d, Form 8582-CR Part IV).",
  verification: "unverified",
  taxYear: ALAR_TAX_YEAR,
  userId: ALAR_USER_ID,
  facts: alarFacts,
  decisions: alarDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: alarExpected(formId),
    goldenPdfPath: lockedGoldenPath("alar", formId),
  })),
};
