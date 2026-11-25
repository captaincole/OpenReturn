/*
 * A made-up single filer (README.md) who moved to California in 2024, filed
 * Form 540NR for 2024 with AMT from an incentive stock option exercise, and is
 * a full-year resident in 2025: FTB 3510 Sections A and B and Part II. The
 * credit is more than the 2025 limit, so part carries to 2026 (Schedule P (540)
 * line 10 column (d)). UNVERIFIED: no answer key; the expected values are
 * engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { hurinDecisions } from "./decisions.js";
import { hurinExpected } from "./expected.js";
import { HURIN_TAX_YEAR, HURIN_USER_ID, hurinFacts } from "./facts.js";

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

export const hurinScenario: Scenario = {
  name: "hurin",
  description:
    "Single filer who filed Form 540NR for 2024 with AMT from an incentive stock option exercise, full-year CA resident in 2025: FTB 3510 Sections A and B and Part II, a credit limited by the 2025 tentative minimum tax, Schedule P (540) line 10 column (d) and Form 540 line 43.",
  verification: "unverified",
  taxYear: HURIN_TAX_YEAR,
  userId: HURIN_USER_ID,
  facts: hurinFacts,
  decisions: hurinDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: hurinExpected(formId),
    goldenPdfPath: lockedGoldenPath("hurin", formId),
  })),
};
