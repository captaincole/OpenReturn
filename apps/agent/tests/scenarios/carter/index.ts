/*
 * Carter scenario bundle — IRS ATS test scenario 8, moved to California.
 *
 * UNVERIFIED. The IRS package is an e-file schema test, not an answer
 * key, and no CPA has prepared this return. The expected values are
 * the engine's output, checked by hand line by line (see expected.ts),
 * then locked. Treat a failure here as "the engine changed", not
 * "the engine is wrong", until a verified source exists.
 *
 *   npm test -- carter
 */

import type { Scenario } from "../../types.js";
import { carterDecisions } from "./decisions.js";
import { carterExpected } from "./expected.js";
import { CARTER_TAX_YEAR, CARTER_USER_ID, carterFacts } from "./facts.js";

/* Forms in dependency order, matching the registry. */
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
  forms: FORM_IDS.map((formId) => ({ formId, expected: carterExpected(formId) })),
};
