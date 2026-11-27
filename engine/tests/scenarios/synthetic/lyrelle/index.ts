/*
 * Made-up taxpayer (README.md): a single full-year California resident with
 * five motion picture credit certificates (FTB 3541): original and new
 * carryovers in Schedule P (540) Section A2, program 3.0, soundstage filming
 * and program 4.0 credits in Section B2, and the program 4.0 refundable
 * election to Form 540 line 74. No answer key: the expected values are
 * hand-checked, locked engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { lyrelleDecisions } from "./decisions.js";
import { lyrelleExpected } from "./expected.js";
import { LYRELLE_TAX_YEAR, LYRELLE_USER_ID, lyrelleFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-8959",
  "schedule-2",
  "form-1040",
  "schedule-ca",
  "schedule-p",
  "form-3541",
  "form-540",
];

export const lyrelleScenario: Scenario = {
  name: "lyrelle",
  description:
    "Single Burbank producer with five FTB 3541 certificates: original and new carryovers limited by TMT in Schedule P (540) Section A2, program 3.0, soundstage and program 4.0 credits in Section B2, the program 4.0 refundable election (Form 540 line 74), Form 540 line 45.",
  taxYear: LYRELLE_TAX_YEAR,
  userId: LYRELLE_USER_ID,
  verification: "unverified",
  facts: lyrelleFacts,
  decisions: lyrelleDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: lyrelleExpected(formId),
    goldenPdfPath: lockedGoldenPath("lyrelle", formId),
  })),
};
