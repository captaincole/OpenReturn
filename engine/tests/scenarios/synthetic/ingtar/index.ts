/*
 * Made-up taxpayers (README.md): a married couple filing jointly, full-year
 * California residents, who traded investment land in Placer County for land
 * in Reno, Nevada, with Ingtar's sister. FTB 3840 reports the exchange and the
 * California sourced deferred gain. No answer key: the expected values are
 * hand-checked, locked engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { ingtarDecisions } from "./decisions.js";
import { ingtarExpected } from "./expected.js";
import { INGTAR_TAX_YEAR, INGTAR_USER_ID, ingtarFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = ["form-8824", "schedule-d", "form-1040", "schedule-ca", "form-540", "form-3840"];

export const ingtarScenario: Scenario = {
  name: "ingtar",
  description:
    "MFJ Sacramento couple: a related party like-kind exchange of Placer County land for Reno land with cash, liabilities and stock (Form 8824), and FTB 3840 with a California basis above the federal one.",
  taxYear: INGTAR_TAX_YEAR,
  userId: INGTAR_USER_ID,
  verification: "unverified",
  facts: ingtarFacts,
  decisions: ingtarDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: ingtarExpected(formId),
    goldenPdfPath: lockedGoldenPath("ingtar", formId),
  })),
};
