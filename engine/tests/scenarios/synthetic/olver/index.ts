/*
 * A made-up taxpayer (README.md): a single real estate professional, a
 * full-year California resident, with a shop building, a rental house and a
 * self-rental. His rentals are not passive federally but are for California,
 * so FTB 3801 files; line 3 is income, his California carryover is allowed,
 * and the Schedule E worksheet goes to Schedule CA (540) line 5 column B.
 * No answer key: the expected values are hand-checked, locked engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { olverDecisions } from "./decisions.js";
import { olverExpected } from "./expected.js";
import { OLVER_TAX_YEAR, OLVER_USER_ID, olverFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "schedule-e",
  "schedule-1",
  "form-1040",
  "form-3885a",
  "form-3801",
  "schedule-ca",
  "form-540",
];

export const olverScenario: Scenario = {
  name: "olver",
  description:
    "Single Oakland real estate professional: a shop building with a California carryover, a rental house with a California depreciation difference and a self-rental; FTB 3801 with income on line 3 and Schedule CA line 5 column B.",
  taxYear: OLVER_TAX_YEAR,
  userId: OLVER_USER_ID,
  verification: "unverified",
  facts: olverFacts,
  decisions: olverDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: olverExpected(formId),
    goldenPdfPath: lockedGoldenPath("olver", formId),
  })),
};
