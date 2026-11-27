/*
 * Made-up taxpayer (README.md): a single full-year California resident with
 * two other credits, a program 3.0 motion picture credit (FTB 3541) and the
 * other state tax credit (Schedule S), so Form 540 lines 43 and 44 take them
 * with no Schedule P (540). No answer key: the expected values are
 * hand-checked, locked engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { moriaDecisions } from "./decisions.js";
import { moriaExpected } from "./expected.js";
import { MORIA_TAX_YEAR, MORIA_USER_ID, moriaFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-8959",
  "schedule-2",
  "form-1040",
  "schedule-ca",
  "form-3541",
  "schedule-s",
  "form-540",
];

export const moriaScenario: Scenario = {
  name: "moria",
  description:
    "Single Santa Monica cinematographer with two program 3.0 film certificates (FTB 3541 line 2 on one, line 5a on the other) and a Utah tax credit: Form 540 lines 43 and 44 with no Schedule P (540), Schedule S line 2 after the film credit.",
  taxYear: MORIA_TAX_YEAR,
  userId: MORIA_USER_ID,
  verification: "unverified",
  facts: moriaFacts,
  decisions: moriaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: moriaExpected(formId),
    goldenPdfPath: lockedGoldenPath("moria", formId),
  })),
};
