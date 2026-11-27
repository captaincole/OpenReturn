/*
 * A made-up taxpayer (README.md): a single Nevada resident with California
 * wages and two stock sales, one with a lower California basis. Schedule D
 * (540NR) ends in a California gain larger than the federal one, so line 12b
 * goes to Schedule CA (540NR) line 7a column C. `nildra` covers line 12a.
 * UNVERIFIED: no answer key; the expected values are engine output checked
 * by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { olmiraDecisions } from "./decisions.js";
import { olmiraExpected } from "./expected.js";
import { OLMIRA_TAX_YEAR, OLMIRA_USER_ID, olmiraFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-8949",
  "schedule-d",
  "form-1040",
  "schedule-d-540nr",
  "schedule-ca-540nr",
  "form-540nr",
];

export const olmiraScenario: Scenario = {
  name: "olmira",
  description:
    "Single Nevada resident with California wages: a sale with a lower California basis; Schedule D (540NR) line 12b and Schedule CA (540NR) line 7a column C.",
  taxYear: OLMIRA_TAX_YEAR,
  userId: OLMIRA_USER_ID,
  verification: "unverified",
  facts: olmiraFacts,
  decisions: olmiraDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: olmiraExpected(formId),
    goldenPdfPath: lockedGoldenPath("olmira", formId),
  })),
};
