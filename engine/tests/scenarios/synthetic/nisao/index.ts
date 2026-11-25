/*
 * A made-up single taxpayer in San Jose, California (README.md): an S
 * corporation K-1 loss under the threshold after his other business income,
 * and a California excess business loss carryover from 2024 (FTB 3461 line
 * 14b) that the federal return never had. The threshold room left this year
 * takes part of the carryover on Schedule CA line 8z column B; the rest
 * carries to 2026 (FTB 3461 line 16). UNVERIFIED: no answer key; the expected
 * values are engine output checked by hand, so a failure means "the engine
 * changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { nisaoDecisions } from "./decisions.js";
import { nisaoExpected } from "./expected.js";
import { NISAO_TAX_YEAR, NISAO_USER_ID, nisaoFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "schedule-c",
  "schedule-se",
  "form-7203",
  "schedule-e",
  "form-461",
  "schedule-1",
  "schedule-2",
  "form-8959",
  "form-8995-a",
  "form-1040",
  "schedule-ca",
  "form-3461",
  "form-540",
];

export const nisaoScenario: Scenario = {
  name: "nisao",
  description:
    "Single San Jose filer with a California excess business loss carryover from 2024 (FTB 3461 line 14b): his business loss is under the threshold, so the room left takes $63,000 of the carryover on Schedule CA line 8z column B and $137,000 carries to 2026.",
  verification: "unverified",
  taxYear: NISAO_TAX_YEAR,
  userId: NISAO_USER_ID,
  facts: nisaoFacts,
  decisions: nisaoDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: nisaoExpected(formId),
    goldenPdfPath: lockedGoldenPath("nisao", formId),
  })),
};
