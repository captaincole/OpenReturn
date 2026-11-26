/*
 * A made-up farmer in Texas (README.md): three canceled debts on Forms 1099-C.
 * Form 982 with the insolvency, farm and principal residence exclusions, the
 * line 5 and line 3 elections and Part II's two passes; the taxable rest of
 * the card on Schedule 1 line 8c. Federal only. UNVERIFIED: no answer key;
 * the expected values are engine output checked by hand, so a failure means
 * "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { aililDecisions } from "./decisions.js";
import { aililExpected } from "./expected.js";
import { AILIL_TAX_YEAR, AILIL_USER_ID, aililFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
export const FORM_IDS = [
  "form-982",
  "schedule-f",
  "schedule-se",
  "schedule-d",
  "schedule-1",
  "form-8995",
  "schedule-2",
  "form-1040",
];

export const aililScenario: Scenario = {
  name: "ailil",
  description:
    "Single TX farmer with three Forms 1099-C: Form 982 lines 1b, 1c and 1e, the line 5 and line 3 elections, Part II's insolvency and farm passes (lines 7–13, 10b), and the card's taxable rest on Schedule 1 line 8c.",
  verification: "unverified",
  taxYear: AILIL_TAX_YEAR,
  userId: AILIL_USER_ID,
  facts: aililFacts,
  decisions: aililDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: aililExpected(formId),
    goldenPdfPath: lockedGoldenPath("ailil", formId),
  })),
};
