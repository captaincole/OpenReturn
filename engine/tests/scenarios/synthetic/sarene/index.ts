/*
 * Made-up taxpayer (README.md): a single full-year California resident whose
 * machine shop is partly inside the former Fresno City enterprise zone. FTB
 * 3805Z apportions the shop's income to the zone, deducts two EZ NOL
 * carryovers (Schedule CA line 9b3) and limits the hiring and sales or use
 * tax credit carryovers to the tax on the zone income; Form 540 line 43 takes
 * the credit. No answer key: the expected values are hand-checked, locked
 * engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { sareneDecisions } from "./decisions.js";
import { sareneExpected } from "./expected.js";
import { SARENE_TAX_YEAR, SARENE_USER_ID, sareneFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "schedule-c",
  "schedule-se",
  "schedule-1",
  "schedule-2",
  "form-8995",
  "form-1040",
  "schedule-ca",
  "form-3805z",
  "form-540",
];

export const sareneScenario: Scenario = {
  name: "sarene",
  description:
    "Single Fresno machine shop owner in a former enterprise zone: FTB 3805Z apportions the shop's income (Worksheet I), deducts EZ NOL carryovers on Schedule CA line 9b3, and limits the credit carryovers to the tax on zone income; Form 540 line 43 takes code 176.",
  taxYear: SARENE_TAX_YEAR,
  userId: SARENE_USER_ID,
  verification: "unverified",
  facts: sareneFacts,
  decisions: sareneDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: sareneExpected(formId),
    goldenPdfPath: lockedGoldenPath("sarene", formId),
  })),
};
