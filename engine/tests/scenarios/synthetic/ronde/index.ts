/*
 * A made-up married couple in Texas (README.md) with a passive partnership
 * K-1 that has income, and a qualified electric vehicle credit from 2005 that
 * Form 8582-CR left unallowed until now: Form 8582-CR Worksheet 4 and line 6
 * allow it, and Form 8834 limits it by the tax after the foreign tax and
 * child tax credits, less the tentative minimum tax. The credit reaches
 * Schedule 3 line 6i. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { rondeDecisions } from "./decisions.js";
import { rondeExpected } from "./expected.js";
import { RONDE_TAX_YEAR, RONDE_USER_ID, rondeFacts } from "./facts.js";

const FORM_IDS = [
  "form-8834",
  "form-8582-cr",
  "form-6251",
  "schedule-e",
  "schedule-1",
  "schedule-2",
  "schedule-3",
  "schedule-8812",
  "form-1040",
];

export const rondeScenario: Scenario = {
  name: "ronde",
  description:
    "MFJ TX couple with a passive partnership K-1 that has income and a 2005 qualified electric vehicle credit carried as a passive credit: Form 8582-CR allows it (Worksheet 4, line 6), Form 8834 limits it by the tax after the foreign tax and child tax credits and the tentative minimum tax, Schedule 3 line 6i.",
  verification: "unverified",
  taxYear: RONDE_TAX_YEAR,
  userId: RONDE_USER_ID,
  facts: rondeFacts,
  decisions: rondeDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: rondeExpected(formId),
    goldenPdfPath: lockedGoldenPath("ronde", formId),
  })),
};
