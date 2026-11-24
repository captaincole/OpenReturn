/*
 * A made-up married couple in Texas (README.md): a limited partner's
 * Schedule K-1 (Form 1065) from a fund he does not work in. Its business
 * income is passive income (Schedule E line 28 column (h)); its interest,
 * dividends and long-term gain go to Form 1040 and Schedule D; its section
 * 199A statement to Form 8995. Their modified AGI is over $250,000, so Form
 * 8960 taxes the smaller of the net investment income and the excess.
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { tamDecisions } from "./decisions.js";
import { tamExpected } from "./expected.js";
import { TAM_TAX_YEAR, TAM_USER_ID, tamFacts } from "./facts.js";

const FORM_IDS = [
  "schedule-b",
  "schedule-d",
  "schedule-e",
  "form-8995",
  "form-8960",
  "schedule-1",
  "schedule-2",
  "form-1040",
];

export const tamScenario: Scenario = {
  name: "tam",
  description:
    "MFJ TX couple: a passive limited partner's K-1 (Form 1065) with business income in Schedule E column (h), interest, dividends, a long-term gain, tax-exempt interest and a section 199A statement; Form 8960 on the excess over $250,000.",
  verification: "unverified",
  taxYear: TAM_TAX_YEAR,
  userId: TAM_USER_ID,
  facts: tamFacts,
  decisions: tamDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: tamExpected(formId),
    goldenPdfPath: lockedGoldenPath("tam", formId),
  })),
};
