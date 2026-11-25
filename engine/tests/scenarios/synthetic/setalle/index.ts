/*
 * A made-up single filer in California (README.md) who paid California AMT
 * for 2024 after exercising incentive stock options: FTB 3510 Part I Section A
 * and Part II, Schedule P (540) Part III line 10 and Form 540 line 43. The
 * whole credit is used in 2025. UNVERIFIED: no answer key; the expected values
 * are engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { setalleDecisions } from "./decisions.js";
import { setalleExpected } from "./expected.js";
import { SETALLE_TAX_YEAR, SETALLE_USER_ID, setalleFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-8959",
  "schedule-2",
  "form-1040",
  "schedule-ca",
  "schedule-p",
  "form-3510",
  "form-540",
];

export const setalleScenario: Scenario = {
  name: "setalle",
  description:
    "Single CA filer with 2024 California AMT from an incentive stock option exercise and exclusion items: FTB 3510 Section A and Part II, Schedule P (540) line 10 and Form 540 line 43; the whole credit is used.",
  verification: "unverified",
  taxYear: SETALLE_TAX_YEAR,
  userId: SETALLE_USER_ID,
  facts: setalleFacts,
  decisions: setalleDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: setalleExpected(formId),
    goldenPdfPath: lockedGoldenPath("setalle", formId),
  })),
};
