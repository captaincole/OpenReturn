/*
 * IRS ATS scenario 8 (docs/irs-ats-2025-scenario-8.pdf), moved to California.
 * UNVERIFIED: the package is an e-file schema test, not an answer key, so a
 * failure means "the engine changed", not "the engine is wrong".
 */

import { lockedGoldenPath } from "../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../types.js";
import { carterDecisions } from "./decisions.js";
import { carterExpected } from "./expected.js";
import { CARTER_TAX_YEAR, CARTER_USER_ID, carterFacts } from "./facts.js";

const FORM_IDS = ["form-1040", "schedule-ca", "form-540"];

export const carterScenario: Scenario = {
  name: "carter",
  description:
    "MFS CA filer, born 1953: Roth and rollover 1099-Rs, capital gain distribution, Social Security (IRS ATS 8).",
  verification: "unverified",
  taxYear: CARTER_TAX_YEAR,
  userId: CARTER_USER_ID,
  facts: carterFacts,
  decisions: carterDecisions,
  allowNotModeled: true,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: carterExpected(formId),
    goldenPdfPath: lockedGoldenPath("carter", formId),
  })),
};
