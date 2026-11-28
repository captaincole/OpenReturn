/*
 * A made-up single hydrogen producer in Texas (README.md): a clean hydrogen
 * production facility on Schedule C with four processes, tax-exempt bond
 * financing, the increased credit and a sale of part of the credit, and a
 * Schedule K-1 (Form 1065) with box 15 code Y. Form 7210 every line, Form 3800
 * line 1g and Schedule 3 line 6a. Federal only. UNVERIFIED: no answer key; the
 * expected values are engine output checked by hand, so a failure means "the
 * engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { randDecisions } from "./decisions.js";
import { randExpected } from "./expected.js";
import { RAND_TAX_YEAR, RAND_USER_ID, randFacts } from "./facts.js";

const FORM_IDS = [
  "form-7210",
  "form-3800",
  "schedule-3",
  "form-1040",
  "schedule-1",
  "schedule-2",
  "schedule-c",
  "schedule-se",
  "schedule-e",
  "form-8959",
  "form-8995-a",
  "form-6251",
];

export const randScenario: Scenario = {
  name: "rand",
  description:
    "Single TX hydrogen producer: a clean hydrogen facility with four emissions bands, tax-exempt bonds, the increased credit and a credit transfer, and a K-1 (Form 1065) code Y; Form 7210 every line, Form 3800 line 1g, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: RAND_TAX_YEAR,
  userId: RAND_USER_ID,
  facts: randFacts,
  decisions: randDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: randExpected(formId),
    goldenPdfPath: lockedGoldenPath("rand", formId),
  })),
};
