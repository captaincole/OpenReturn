/*
 * A made-up single filer in Washington (README.md): he bought a 60% interest
 * in a low-income housing building in June 2025. Form 8609-A with a part-year
 * adjustment (lines 4 and 8), additions to qualified basis (lines 7 to 12), a
 * federal grant (line 14) and his share (line 16). Federal only. The credit
 * goes to Form 8586 line 3, Form 3800 line 4d and Form 8582-CR, which allows
 * the tax on $25,000. UNVERIFIED: no answer key; the expected values are
 * engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { ewinDecisions } from "./decisions.js";
import { ewinExpected } from "./expected.js";
import { EWIN_TAX_YEAR, EWIN_USER_ID, ewinFacts } from "./facts.js";

const FORM_IDS = [
  "form-8609-a",
  "form-8586",
  "form-8582-cr",
  "form-3800",
  "schedule-3",
  "form-1040",
];

export const ewinScenario: Scenario = {
  name: "ewin",
  description:
    "Single WA filer who bought a 60% interest in a low-income housing building in June 2025 (Form 8609-A lines 1–16 and 18: part year, additions to qualified basis, a federal grant, his share).",
  verification: "unverified",
  taxYear: EWIN_TAX_YEAR,
  userId: EWIN_USER_ID,
  facts: ewinFacts,
  decisions: ewinDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: ewinExpected(formId),
    goldenPdfPath: lockedGoldenPath("ewin", formId),
  })),
};
