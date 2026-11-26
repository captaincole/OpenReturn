/*
 * A made-up single filer in Texas (README.md) who holds tax credit bonds: two
 * Forms 1097-BTC (Part III), a QECB that matured in July and a build America
 * bond with no Form 1097-BTC (two Parts IV), and a carryforward. The credit
 * reaches Schedule 3 line 6k; the QECB credit no Form 1099-INT reports is a
 * Schedule B line 1 row. Federal only. UNVERIFIED: no answer key; the
 * expected values are engine output checked by hand.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { varilinDecisions } from "./decisions.js";
import { varilinExpected } from "./expected.js";
import { VARILIN_TAX_YEAR, VARILIN_USER_ID, varilinFacts } from "./facts.js";

const FORM_IDS = ["form-8912", "schedule-b", "schedule-3", "form-1040"];

export const varilinScenario: Scenario = {
  name: "varilin",
  description:
    "Single TX filer with tax credit bonds: two Forms 1097-BTC, a QECB that matured mid-year (prorated, 70%), a build America bond, a carryforward (Form 8912 all parts, Schedule B row, Schedule 3 line 6k).",
  verification: "unverified",
  taxYear: VARILIN_TAX_YEAR,
  userId: VARILIN_USER_ID,
  facts: varilinFacts,
  decisions: varilinDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: varilinExpected(formId),
    goldenPdfPath: lockedGoldenPath("varilin", formId),
  })),
};
