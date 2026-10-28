/*
 * IRS ATS scenario 1 (docs/irs-ats-2025-scenario-1.pdf), moved to California.
 * UNVERIFIED: the package is an e-file schema test, not an answer key, so a
 * failure means "the engine changed", not "the engine is wrong".
 */

import { lockedGoldenPath } from "../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../types.js";
import { taraDecisions } from "./decisions.js";
import { taraExpected } from "./expected.js";
import { TARA_TAX_YEAR, TARA_USER_ID, taraFacts } from "./facts.js";

const FORM_IDS = [
  "schedule-h",
  "schedule-2",
  "form-5695",
  "schedule-3",
  "form-1040",
  "schedule-ca",
  "form-540",
];

export const taraScenario: Scenario = {
  name: "tara",
  description:
    "Single CA filer, two W-2s: household employee (Schedule H) and home energy improvements (Form 5695) (IRS ATS 1).",
  verification: "unverified",
  taxYear: TARA_TAX_YEAR,
  userId: TARA_USER_ID,
  facts: taraFacts,
  decisions: taraDecisions,
  allowNotModeled: true,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: taraExpected(formId),
    goldenPdfPath: lockedGoldenPath("tara", formId),
  })),
};
