/*
 * A made-up farmer in South Dakota (README.md): a farm loss that makes a 2025
 * NOL, carried back to 2023 and 2024 (Form 172 Parts I and II), and a 2016
 * NOL carryover deducted on Schedule 1 line 8a. Federal only. UNVERIFIED: no
 * answer key; the expected values are engine output checked by hand, so a
 * failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { galinaDecisions } from "./decisions.js";
import { galinaExpected } from "./expected.js";
import { GALINA_TAX_YEAR, GALINA_USER_ID, galinaFacts } from "./facts.js";

const FORM_IDS = [
  "form-172",
  "schedule-1",
  "form-1040",
  "schedule-f",
  "schedule-d",
  "form-8949",
  "form-8995",
];

export const galinaScenario: Scenario = {
  name: "galina",
  description:
    "Single SD farmer: a $80,000 farm loss makes a $60,000 NOL (Form 172 Part I), carried back to 2023 and 2024 (Part II, both columns, the itemized adjustments), and a 2016 NOL carryover on Schedule 1 line 8a.",
  verification: "unverified",
  taxYear: GALINA_TAX_YEAR,
  userId: GALINA_USER_ID,
  facts: galinaFacts,
  decisions: galinaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: galinaExpected(formId),
    goldenPdfPath: lockedGoldenPath("galina", formId),
  })),
};
