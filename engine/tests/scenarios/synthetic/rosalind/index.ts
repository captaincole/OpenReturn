/*
 * Made-up taxpayer (README.md): a single full-year California resident whose
 * California capital loss carryover from 2024 makes her California capital gain
 * lower than the federal gain. Schedule D (540) line 12a goes to Schedule CA
 * line 7a column B. No answer key: the expected values are hand-checked, locked
 * engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { rosalindDecisions } from "./decisions.js";
import { rosalindExpected } from "./expected.js";
import { ROSALIND_TAX_YEAR, ROSALIND_USER_ID, rosalindFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-8949",
  "schedule-d",
  "form-1040",
  "schedule-d-ca",
  "schedule-ca",
  "form-540",
];

export const rosalindScenario: Scenario = {
  name: "rosalind",
  description:
    "Single CA filer: W-2, three stock sales and capital gain distributions, and a California capital loss carryover the federal return does not have (Schedule D (540) line 12a).",
  taxYear: ROSALIND_TAX_YEAR,
  userId: ROSALIND_USER_ID,
  verification: "unverified",
  facts: rosalindFacts,
  decisions: rosalindDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: rosalindExpected(formId),
    goldenPdfPath: lockedGoldenPath("rosalind", formId),
  })),
};
