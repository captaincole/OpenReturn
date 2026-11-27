/*
 * Made-up taxpayer (README.md): a single full-year California resident with a
 * one-person business at Mare Island, a former LAMBRA. Worksheet I apportions
 * three fifths of her profit to the LAMBRA on the property factor alone, and
 * Worksheet II deducts her 2011 and 2012 LAMBRA NOL carryovers up to it; the
 * rest carries to 2026. Schedule CA (540) line 9b3 takes the deduction. No
 * answer key: the expected values are hand-checked, locked engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { tarnaDecisions } from "./decisions.js";
import { tarnaExpected } from "./expected.js";
import { TARNA_TAX_YEAR, TARNA_USER_ID, tarnaFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "schedule-c",
  "schedule-se",
  "schedule-1",
  "schedule-2",
  "form-8995",
  "form-1040",
  "schedule-ca",
  "form-3807",
  "form-540",
];

export const tarnaScenario: Scenario = {
  name: "tarna",
  description:
    "Single Vallejo marine engine mechanic with 2011 and 2012 LAMBRA NOL carryovers: FTB 3807 Worksheet I on the property factor alone, Worksheet II and Part III, Schedule CA (540) line 9b3.",
  taxYear: TARNA_TAX_YEAR,
  userId: TARNA_USER_ID,
  verification: "unverified",
  facts: tarnaFacts,
  decisions: tarnaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: tarnaExpected(formId),
    goldenPdfPath: lockedGoldenPath("tarna", formId),
  })),
};
