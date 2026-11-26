/*
 * A made-up single filer in Wyoming (README.md): an aerial application and fuel
 * business with a fuel tax claim on every row of Form 4136, and kerosene for
 * her home. The credit reaches Schedule 3 lines 12 and 15 and Form 1040 line
 * 31. Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { meilynDecisions } from "./decisions.js";
import { meilynExpected } from "./expected.js";
import { MEILYN_TAX_YEAR, MEILYN_USER_ID, meilynFacts } from "./facts.js";

const FORM_IDS = [
  "form-4136",
  "schedule-3",
  "form-1040",
  "schedule-1",
  "schedule-2",
  "schedule-c",
  "schedule-se",
  "form-8995",
];

export const meilynScenario: Scenario = {
  name: "meilyn",
  description:
    "Single WY agricultural pilot and fuel dealer: a Form 4136 claim on every row (bus rates, gallon equivalents, brackets, registered vendor lines, home kerosene), Schedule 3 lines 12 and 15, Form 1040 line 31.",
  verification: "unverified",
  taxYear: MEILYN_TAX_YEAR,
  userId: MEILYN_USER_ID,
  facts: meilynFacts,
  decisions: meilynDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: meilynExpected(formId),
    goldenPdfPath: lockedGoldenPath("meilyn", formId),
  })),
};
