/*
 * A made-up single filer in Texas (README.md): a renewable fuel business
 * (Schedule C) with two clean fuel facilities, one of them with a section 6418
 * transfer, and a Schedule K-1 (Form 1065) with a clean fuel production
 * credit (box 15 code X). Form 7218 (three copies: each facility and the
 * pass-through credits), Form 3800 Part III line 1q and Part V, and Schedule
 * 3 line 6a. Federal only. UNVERIFIED: no answer key; the expected values are
 * engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { abellDecisions } from "./decisions.js";
import { abellExpected } from "./expected.js";
import { ABELL_TAX_YEAR, ABELL_USER_ID, abellFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-7218",
  "schedule-c",
  "schedule-se",
  "schedule-e",
  "schedule-1",
  "form-8995-a",
  "form-6251",
  "form-3800",
  "schedule-2",
  "schedule-3",
  "form-1040",
];

export const abellScenario: Scenario = {
  name: "abell",
  description:
    "Single TX filer: a renewable fuel business with two clean fuel facilities (one with a credit transfer) and a K-1 code X credit; Form 7218 in three copies, Form 3800 line 1q and Part V, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: ABELL_TAX_YEAR,
  userId: ABELL_USER_ID,
  facts: abellFacts,
  decisions: abellDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: abellExpected(formId),
    goldenPdfPath: lockedGoldenPath("abell", formId),
  })),
};
