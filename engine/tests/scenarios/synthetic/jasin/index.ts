/*
 * A made-up single landowner in Texas (README.md): a W-2 and a farm rented for
 * a share of the crop, with an amount on every line of Form 4835 Parts I and II,
 * the 25% conservation limit on line 10 and net income on line 32, carried to
 * Schedule E lines 40 to 42. Federal only. UNVERIFIED: no answer key; the
 * expected values are engine output checked by hand, so a failure means "the
 * engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { jasinDecisions } from "./decisions.js";
import { jasinExpected } from "./expected.js";
import { JASIN_TAX_YEAR, JASIN_USER_ID, jasinFacts } from "./facts.js";

const FORM_IDS = ["form-4835", "schedule-e", "schedule-1", "form-1040"];

export const jasinScenario: Scenario = {
  name: "jasin",
  description:
    "Single TX landowner: a W-2 and a crop-share farm rental with every Form 4835 Part I and II line, the 25% conservation limit and net income to Schedule E lines 40–42.",
  verification: "unverified",
  taxYear: JASIN_TAX_YEAR,
  userId: JASIN_USER_ID,
  facts: jasinFacts,
  decisions: jasinDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: jasinExpected(formId),
    goldenPdfPath: lockedGoldenPath("jasin", formId),
  })),
};
