/*
 * Made-up taxpayer (README.md): a single full-year California resident whose
 * machine shop sits partly in the former Tulare County Targeted Tax Area. FTB
 * 3809 limits her TTA hiring and sales or use tax credit carryovers by the tax
 * on her TTA business income; Schedule P (540) Section B2 takes them after
 * the prison inmate labor credit, and before the PTE elective tax credit, so
 * Form 540 line 45 holds the three. No answer key: the expected values are
 * hand-checked, locked engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { toveineDecisions } from "./decisions.js";
import { toveineExpected } from "./expected.js";
import { TOVEINE_TAX_YEAR, TOVEINE_USER_ID, toveineFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "schedule-c",
  "schedule-se",
  "schedule-1",
  "schedule-2",
  "form-8959",
  "form-8995-a",
  "form-1040",
  "schedule-ca",
  "schedule-p",
  "form-3507",
  "form-3809",
  "form-3804-cr",
  "form-540",
];

export const toveineScenario: Scenario = {
  name: "toveine",
  description:
    "Single Porterville machine shop owner with TTA credit carryovers (FTB 3809): Schedule Z limits them by the tax on TTA business income, Schedule P (540) Section B2 line 16 takes them, Form 540 line 45 with the prison inmate labor and PTE elective tax credits.",
  taxYear: TOVEINE_TAX_YEAR,
  userId: TOVEINE_USER_ID,
  verification: "unverified",
  facts: toveineFacts,
  decisions: toveineDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: toveineExpected(formId),
    goldenPdfPath: lockedGoldenPath("toveine", formId),
  })),
};
