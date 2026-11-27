/*
 * A made-up single filer in Reno (README.md): a battery company (Schedule C),
 * a qualified small business, that claims the alternative simplified credit
 * with the section 280C election and elects part of it as a payroll tax
 * credit. Form 6765 Sections B, C, D, E and F, Form 3800 Part III line 4i and
 * the carryforward the payroll tax credit reads, and Schedule 3 line 6a.
 * Federal only. The branch that cowin cannot show: cowin has no election.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { denaDecisions } from "./decisions.js";
import { denaExpected } from "./expected.js";
import { DENA_TAX_YEAR, DENA_USER_ID, denaFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
export const FORM_IDS = [
  "form-6765",
  "schedule-c",
  "schedule-se",
  "schedule-1",
  "form-8995-a",
  "form-3800",
  "form-8959",
  "schedule-2",
  "schedule-3",
  "form-1040",
];

export const denaScenario: Scenario = {
  name: "dena",
  description:
    "Single NV battery company owner with the alternative simplified credit, the 280C election and the payroll tax election: Form 6765 Sections B, C, D, E and F, Form 3800 line 4i, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: DENA_TAX_YEAR,
  userId: DENA_USER_ID,
  facts: denaFacts,
  decisions: denaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: denaExpected(formId),
    goldenPdfPath: lockedGoldenPath("dena", formId),
  })),
};
