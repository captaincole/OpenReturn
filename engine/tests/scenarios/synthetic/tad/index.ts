/*
 * A made-up single filer in Texas (README.md): an engineer with a solar farm
 * that sells its output to a utility. Form 7211 (the alternative amount, both
 * bonuses and the tax-exempt bond reduction), Form 3800 line 1gg, the credit
 * limit that the tentative minimum tax sets, and Schedule 3 line 6a. Federal
 * only. UNVERIFIED: no answer key; the expected values are engine output
 * checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { tadDecisions } from "./decisions.js";
import { tadExpected } from "./expected.js";
import { TAD_TAX_YEAR, TAD_USER_ID, tadFacts } from "./facts.js";

const FORM_IDS = [
  "form-7211",
  "form-3800",
  "schedule-3",
  "form-1040",
  "schedule-1",
  "schedule-2",
  "schedule-c",
  "schedule-se",
  "form-6251",
  "form-8959",
  "form-8995-a",
];

export const tadScenario: Scenario = {
  name: "tad",
  description:
    "Single TX filer with a solar farm: Form 7211 (alternative amount, energy community and domestic content bonuses, tax-exempt bond reduction), Form 3800 line 1gg limited by the tentative minimum tax, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: TAD_TAX_YEAR,
  userId: TAD_USER_ID,
  facts: tadFacts,
  decisions: tadDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: tadExpected(formId),
    goldenPdfPath: lockedGoldenPath("tad", formId),
  })),
};
