/*
 * A made-up divorced parent in Nevada (README.md): three children with the
 * other parent. She released one child's 2025 claim (no child tax credit, but
 * head of household, the EIC), claims one who lives with the other parent
 * through his Form 8332 release, and claims one after her revocation took
 * effect. Two copies of Form 8332, the 1040 head of household child's name,
 * Schedules 8812 and EIC. Federal only. UNVERIFIED: no answer key; the
 * expected values are engine output checked by hand, so a failure means
 * "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { ellorienDecisions } from "./decisions.js";
import { ellorienExpected } from "./expected.js";
import { ELLORIEN_TAX_YEAR, ELLORIEN_USER_ID, ellorienFacts } from "./facts.js";

const FORM_IDS = ["form-8332", "schedule-8812", "schedule-eic", "form-1040"];

export const ellorienScenario: Scenario = {
  name: "ellorien",
  description:
    "HOH NV parent, three children: one released to the other parent (head of household name, EIC, no child tax credit), one claimed through the other parent's Form 8332, one claimed after a revocation (two Forms 8332, Schedules 8812 and EIC).",
  verification: "unverified",
  taxYear: ELLORIEN_TAX_YEAR,
  userId: ELLORIEN_USER_ID,
  facts: ellorienFacts,
  decisions: ellorienDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: ellorienExpected(formId),
    goldenPdfPath: lockedGoldenPath("ellorien", formId),
  })),
};
