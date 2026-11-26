/*
 * A made-up single filer in Texas (README.md) who sold a home bought with a
 * loan from a tax-exempt mortgage bond: Form 8828 with every line, the income
 * percentage below 100, and the recapture tax on Schedule 2 line 17b.
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { melaineDecisions } from "./decisions.js";
import { melaineExpected } from "./expected.js";
import { MELAINE_TAX_YEAR, MELAINE_USER_ID, melaineFacts } from "./facts.js";

const FORM_IDS = ["form-8828", "schedule-2", "form-1040"];

export const melaineScenario: Scenario = {
  name: "melaine",
  description:
    "Single TX filer who sold a home financed by a tax-exempt mortgage bond loan after 5 years (Form 8828 lines 1–23, income percentage 59, Schedule 2 line 17b).",
  verification: "unverified",
  taxYear: MELAINE_TAX_YEAR,
  userId: MELAINE_USER_ID,
  facts: melaineFacts,
  decisions: melaineDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: melaineExpected(formId),
    goldenPdfPath: lockedGoldenPath("melaine", formId),
  })),
};
