/*
 * A made-up single filer in Texas (README.md): a W-2, four firms that paid her
 * as a contractor when she was an employee (Form 8919, all four reason codes),
 * and a small photography business. Federal only. UNVERIFIED: no answer key;
 * the expected values are engine output checked by hand, so a failure means
 * "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { egweneDecisions } from "./decisions.js";
import { egweneExpected } from "./expected.js";
import { EGWENE_TAX_YEAR, EGWENE_USER_ID, egweneFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-8919",
  "schedule-c",
  "schedule-se",
  "form-8959",
  "form-8995",
  "schedule-1",
  "schedule-2",
  "form-1040",
];

export const egweneScenario: Scenario = {
  name: "egwene",
  description:
    "Single TX filer: a W-2, four misclassified firms (Form 8919 codes A, C, G, H; 1040 line 1g, Schedule 2 line 6, Form 8959 line 3) and a Schedule C business (Schedule SE line 8c).",
  verification: "unverified",
  taxYear: EGWENE_TAX_YEAR,
  userId: EGWENE_USER_ID,
  facts: egweneFacts,
  decisions: egweneDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: egweneExpected(formId),
    goldenPdfPath: lockedGoldenPath("egwene", formId),
  })),
};
