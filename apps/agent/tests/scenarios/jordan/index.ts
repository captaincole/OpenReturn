/*
 * Jordan scenario bundle.
 *
 * A fake high-income persona: one large W-2 with
 * an employer HSA contribution, a consolidated broker 1099 (DIV, INT,
 * MISC, B boxes D and E), RSU sales (box B), a 1099-DA (box H, one
 * "VARIOUS" lot), a crypto-exchange 1099-MISC, two 401(k) rollover
 * 1099-Rs (codes G and H), and a 1099-SA.
 *
 * Expected values are LOCKED engine output (scripts/lockScenario.ts),
 * after the engine's output was verified (docs/contributing.md,
 * "Scenarios"). Any change to a locked line fails until it is verified
 * and locked again. Form 8949 rows were locked without a row-level check
 * (assumed correct); only their Schedule D totals are verified.
 *
 *   npm test -- jordan
 */

import type { Scenario } from "../../types.js";
import { jordanDecisions } from "./decisions.js";
import { jordanExpected } from "./expected.js";
import { JORDAN_TAX_YEAR, JORDAN_USER_ID, jordanFacts } from "./facts.js";
import { jordanKnownMismatches } from "./knownMismatches.js";

/* Forms in dependency order, matching the registry. */
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
  forms: FORM_IDS.map((formId) => ({ formId, expected: jordanExpected(formId) })),
};
