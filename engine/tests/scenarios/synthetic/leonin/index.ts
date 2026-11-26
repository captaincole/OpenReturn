/*
 * A made-up taxpayer (README.md): a single Fresno resident with a rental that
 * has net income (FTB 3801 does not file) and two California passive credits:
 * a low-income housing credit through a partnership interest bought before
 * 1990, and a research credit. FTB 3801-CR lines 2a to 7 and 17; Form 540
 * lines 43 and 44 with no Schedule P (540). No answer key: the expected values
 * are hand-checked, locked engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { leoninDecisions } from "./decisions.js";
import { leoninExpected } from "./expected.js";
import { LEONIN_TAX_YEAR, LEONIN_USER_ID, leoninFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "schedule-e",
  "form-8582",
  "schedule-1",
  "form-1040",
  "schedule-ca",
  "form-3801-cr",
  "form-540",
];

export const leoninScenario: Scenario = {
  name: "leonin",
  description:
    "Single Fresno filer with a rental's net passive income and two California passive credits (low-income housing before 1990, research): FTB 3801-CR Part I and line 17, Form 540 lines 43 and 44 with no Schedule P.",
  taxYear: LEONIN_TAX_YEAR,
  userId: LEONIN_USER_ID,
  verification: "unverified",
  facts: leoninFacts,
  decisions: leoninDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: leoninExpected(formId),
    goldenPdfPath: lockedGoldenPath("leonin", formId),
  })),
};
