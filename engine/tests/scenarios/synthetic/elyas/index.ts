/*
 * Made-up taxpayer (README.md): a single full-year California resident who paid
 * nonresident tax to Massachusetts on wages. One Schedule S; he takes the
 * standard deduction, so no Schedule P (540) files and Form 540 line 43 takes
 * Schedule S line 12 itself. No answer key: the expected values are
 * hand-checked, locked engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { elyasDecisions } from "./decisions.js";
import { elyasExpected } from "./expected.js";
import { ELYAS_TAX_YEAR, ELYAS_USER_ID, elyasFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = ["form-1040", "schedule-ca", "schedule-s", "form-540"];

export const elyasScenario: Scenario = {
  name: "elyas",
  description:
    "Single Sacramento filer with Massachusetts nonresident tax on wages: Schedule S line 12 is line 6, and Form 540 line 43 takes it with no Schedule P.",
  taxYear: ELYAS_TAX_YEAR,
  userId: ELYAS_USER_ID,
  verification: "unverified",
  facts: elyasFacts,
  decisions: elyasDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: elyasExpected(formId),
    goldenPdfPath: lockedGoldenPath("elyas", formId),
  })),
};
