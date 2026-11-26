/*
 * Made-up taxpayer (README.md): a single full-year California resident with
 * three other credits (a pass-through prison inmate labor credit, Utah tax,
 * PTE elective tax). The prison inmate labor credit is more than the tax above
 * tentative minimum tax; the rest is lost, so FTB 3507 line 7 is 0 (decision
 * A68), and Form 540 line 45 takes the three credits. No answer key: the expected values are
 * hand-checked, locked engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { katerineDecisions } from "./decisions.js";
import { katerineExpected } from "./expected.js";
import { KATERINE_TAX_YEAR, KATERINE_USER_ID, katerineFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-8959",
  "schedule-2",
  "form-1040",
  "schedule-ca",
  "schedule-p",
  "form-3507",
  "schedule-s",
  "form-3804-cr",
  "form-540",
];

export const katerineScenario: Scenario = {
  name: "katerine",
  description:
    "Single Sacramento filer with a K-1 prison inmate labor credit above the tax over TMT (FTB 3507 line 7 of 0: no carryover), Utah tax and a PTE elective tax credit: Schedule S line 2 after code 162, Form 540 line 45.",
  taxYear: KATERINE_TAX_YEAR,
  userId: KATERINE_USER_ID,
  verification: "unverified",
  facts: katerineFacts,
  decisions: katerineDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: katerineExpected(formId),
    goldenPdfPath: lockedGoldenPath("katerine", formId),
  })),
};
