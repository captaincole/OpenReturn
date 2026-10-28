/*
 * Fake persona. Expected values are LOCKED engine output. Form 8949 rows were
 * locked without a row-level check; only their Schedule D totals are verified.
 */

import { lockedGoldenPath } from "../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../types.js";
import { jordanDecisions } from "./decisions.js";
import { jordanExpected } from "./expected.js";
import { JORDAN_TAX_YEAR, JORDAN_USER_ID, jordanFacts } from "./facts.js";
import { jordanKnownMismatches } from "./knownMismatches.js";

const FORM_IDS = [
  "form-8949",
  "schedule-d",
  "schedule-b",
  "schedule-1",
  "form-8889",
  "form-8959",
  "form-8960",
  "schedule-2",
  "form-8995-a",
  "form-1040",
  "schedule-d-ca",
  "schedule-ca",
  "form-540",
  "form-5805",
];

export const jordanScenario: Scenario = {
  name: "jordan",
  description:
    "Single CA filer, $673k W-2 + HSA, broker/RSU/crypto sales, 401(k) rollovers, 1099-MISC — the HNW roadmap scenario.",
  taxYear: JORDAN_TAX_YEAR,
  userId: JORDAN_USER_ID,
  facts: jordanFacts,
  decisions: jordanDecisions,
  allowNotModeled: true,
  knownMismatches: jordanKnownMismatches,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: jordanExpected(formId),
    goldenPdfPath: lockedGoldenPath("jordan", formId),
  })),
};
