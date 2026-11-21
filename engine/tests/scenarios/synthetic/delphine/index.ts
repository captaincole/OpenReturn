/*
 * A made-up single filer in Nevada (README.md): three W-2s from tipped jobs,
 * two daily tip records and one employer's allocated tips (Form 4137).
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { delphineDecisions } from "./decisions.js";
import { delphineExpected } from "./expected.js";
import { DELPHINE_TAX_YEAR, DELPHINE_USER_ID, delphineFacts } from "./facts.js";

const FORM_IDS = ["form-4137", "schedule-2", "form-1040"];

export const delphineScenario: Scenario = {
  name: "delphine",
  description:
    "Single NV server: three W-2s, unreported cash tips, tips in months under $20, noncash tips and W-2 box 8 allocated tips (Form 4137, 1040 line 1c, Schedule 2 line 5).",
  verification: "unverified",
  taxYear: DELPHINE_TAX_YEAR,
  userId: DELPHINE_USER_ID,
  facts: delphineFacts,
  decisions: delphineDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: delphineExpected(formId),
    goldenPdfPath: lockedGoldenPath("delphine", formId),
  })),
};
