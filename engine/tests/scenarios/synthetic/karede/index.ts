/*
 * A made-up 17-year-old in Sacramento (README.md): a W-2, bank interest, and
 * dividends. FTB 3800 with every line filled: the parents' joint
 * Form 540, a brother on line 7, and line 18 on Form 540 line 31. Form 8615
 * files too. UNVERIFIED: no answer key; the expected values are engine output
 * checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { karedeDecisions } from "./decisions.js";
import { karedeExpected } from "./expected.js";
import { KAREDE_TAX_YEAR, KAREDE_USER_ID, karedeFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "schedule-b",
  "form-8615",
  "form-1040",
  "schedule-ca",
  "form-3800-ca",
  "form-540",
];

export const karedeScenario: Scenario = {
  name: "karede",
  description:
    "Single Sacramento 17-year-old: W-2, bank interest, dividends; FTB 3800 at the parents' MFJ rate with a brother on line 7 (line 18 to Form 540 line 31), and Form 8615.",
  verification: "unverified",
  taxYear: KAREDE_TAX_YEAR,
  userId: KAREDE_USER_ID,
  facts: karedeFacts,
  decisions: karedeDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: karedeExpected(formId),
    goldenPdfPath: lockedGoldenPath("karede", formId),
  })),
};
