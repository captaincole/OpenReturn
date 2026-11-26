/*
 * Made-up taxpayer (README.md): a single full-year California resident whose
 * business employs inmates under an approved joint venture. FTB 3507 adds her
 * own credit, a partnership's pass-through credit and a 2024 carryover;
 * Schedule P (540) line 4 uses all of it, and Form 540 lines 43 and 44 take it
 * with the PTE elective tax credit. No answer key: the expected values are
 * hand-checked, locked engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { javindhraDecisions } from "./decisions.js";
import { javindhraExpected } from "./expected.js";
import { JAVINDHRA_TAX_YEAR, JAVINDHRA_USER_ID, javindhraFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "schedule-c",
  "schedule-se",
  "schedule-1",
  "schedule-2",
  "form-8995",
  "form-1040",
  "schedule-ca",
  "schedule-p",
  "form-3507",
  "form-3804-cr",
  "form-540",
];

export const javindhraScenario: Scenario = {
  name: "javindhra",
  description:
    "Single Stockton business owner with the prison inmate labor credit (own wages, a K-1 credit, a 2024 carryover): FTB 3507 line 6a from Schedule P (540) line 4, Form 540 lines 43 and 44 with the PTE elective tax credit.",
  taxYear: JAVINDHRA_TAX_YEAR,
  userId: JAVINDHRA_USER_ID,
  verification: "unverified",
  facts: javindhraFacts,
  decisions: javindhraDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: javindhraExpected(formId),
    goldenPdfPath: lockedGoldenPath("javindhra", formId),
  })),
};
