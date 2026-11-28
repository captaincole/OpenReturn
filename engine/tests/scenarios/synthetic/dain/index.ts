/*
 * A made-up single filer in Texas (README.md): undivided shares of an advanced
 * reactor (section 45J) and of an older station (section 45U), held through a
 * single-member LLC (Schedule C), and a Schedule K-1 (Form 1065) with both
 * nuclear credits in box 15. Form 7213 Parts I and II, the separate form for
 * the K-1 credits, and Form 3800 Part III lines 1cc and 1u with a section 6418
 * transfer. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { dainDecisions } from "./decisions.js";
import { dainExpected } from "./expected.js";
import { DAIN_TAX_YEAR, DAIN_USER_ID, dainFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
export const FORM_IDS = [
  "form-7213",
  "schedule-c",
  "schedule-se",
  "schedule-e",
  "schedule-1",
  "form-8995-a",
  "form-8959",
  "form-6251",
  "form-3800",
  "schedule-2",
  "schedule-3",
  "form-1040",
];

export const dainScenario: Scenario = {
  name: "dain",
  description:
    "Single TX reactor engineer with undivided shares of a 45J reactor and a 45U station and a K-1 with codes A and B: Form 7213 Parts I and II and the pass-through copy, Form 3800 lines 1cc and 1u with a transfer, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: DAIN_TAX_YEAR,
  userId: DAIN_USER_ID,
  facts: dainFacts,
  decisions: dainDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: dainExpected(formId),
    goldenPdfPath: lockedGoldenPath("dain", formId),
  })),
};
