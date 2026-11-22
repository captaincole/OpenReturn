/*
 * A made-up 17-year-old in Washington (README.md): a W-2, interest, and
 * dividends with capital gain distributions from an inherited fund. Form 8615
 * with every line filled: the parents' joint return, a brother on line 7, the
 * Line 5 Worksheet #1 parts, and line 18 on Form 1040 line 16. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked
 * by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { nynaeveDecisions } from "./decisions.js";
import { nynaeveExpected } from "./expected.js";
import { NYNAEVE_TAX_YEAR, NYNAEVE_USER_ID, nynaeveFacts } from "./facts.js";

const FORM_IDS = ["form-8615", "schedule-b", "form-1040"];

export const nynaeveScenario: Scenario = {
  name: "nynaeve",
  description:
    "Single WA 17-year-old: W-2, interest, dividends with capital gain distributions; Form 8615 at the parents' MFJ rate with a brother on line 7 (line 18 to Form 1040 line 16).",
  verification: "unverified",
  taxYear: NYNAEVE_TAX_YEAR,
  userId: NYNAEVE_USER_ID,
  facts: nynaeveFacts,
  decisions: nynaeveDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: nynaeveExpected(formId),
    goldenPdfPath: lockedGoldenPath("nynaeve", formId),
  })),
};
