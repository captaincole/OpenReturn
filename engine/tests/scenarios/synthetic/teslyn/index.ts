/*
 * Made-up taxpayer (README.md): a single full-year California resident with
 * three other credits (prior year AMT, Utah tax, PTE elective tax), so
 * Schedule P (540) Part III orders them and Form 540 line 45 takes the total. No answer key: the expected values are hand-checked, locked engine
 * output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { teslynDecisions } from "./decisions.js";
import { teslynExpected } from "./expected.js";
import { TESLYN_TAX_YEAR, TESLYN_USER_ID, teslynFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-8959",
  "schedule-2",
  "form-1040",
  "schedule-ca",
  "schedule-p",
  "form-3510",
  "schedule-s",
  "form-3804-cr",
  "form-540",
];

export const teslynScenario: Scenario = {
  name: "teslyn",
  description:
    "Single Oakland filer with three other credits (prior year AMT, Utah tax, PTE elective tax): Schedule P (540) line 21 after line 20, FTB 3804-CR line 4 from its column (b), Form 540 line 45.",
  taxYear: TESLYN_TAX_YEAR,
  userId: TESLYN_USER_ID,
  verification: "unverified",
  facts: teslynFacts,
  decisions: teslynDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: teslynExpected(formId),
    goldenPdfPath: lockedGoldenPath("teslyn", formId),
  })),
};
