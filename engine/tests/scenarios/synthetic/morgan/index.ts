/*
 * Synthetic (README.md): a made-up Texas couple filing jointly who elect Form
 * 8814 for two daughters. UNVERIFIED: no answer key; the expected values are
 * engine output, checked by hand against the form and its instructions.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { morganDecisions } from "./decisions.js";
import { morganExpected } from "./expected.js";
import { MORGAN_TAX_YEAR, MORGAN_USER_ID, morganFacts } from "./facts.js";

const FORM_IDS = [
  "form-8814",
  "form-8949",
  "schedule-d",
  "schedule-b",
  "schedule-1",
  "schedule-8812",
  "form-1040",
];

export const morganScenario: Scenario = {
  name: "morgan",
  description:
    "MFJ TX filers: W-2, interest, dividends, a stock sale (Schedule D), and Form 8814 for two daughters (synthetic).",
  verification: "unverified",
  taxYear: MORGAN_TAX_YEAR,
  userId: MORGAN_USER_ID,
  facts: morganFacts,
  decisions: morganDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: morganExpected(formId),
    goldenPdfPath: lockedGoldenPath("morgan", formId),
  })),
};
