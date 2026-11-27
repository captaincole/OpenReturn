/*
 * A made-up taxpayer (README.md): a single Nevada resident all year with
 * wages for workdays in Truckee, California, interest from a Reno bank and a
 * rental house in Sacramento. Form 540NR and Schedule CA (540NR) for a
 * full-year nonresident. UNVERIFIED: no answer key; the expected values are
 * engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { riannaDecisions } from "./decisions.js";
import { riannaExpected } from "./expected.js";
import { RIANNA_TAX_YEAR, RIANNA_USER_ID, riannaFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-8582",
  "schedule-e",
  "schedule-1",
  "form-1040",
  "schedule-ca-540nr",
  "form-540nr",
];

export const riannaScenario: Scenario = {
  name: "rianna",
  description:
    "Single Nevada resident all year with California-source wages and a Sacramento rental: Schedule CA (540NR) Part I line 5, Part II column E with a line at 0, Part IV, and Form 540NR.",
  taxYear: RIANNA_TAX_YEAR,
  userId: RIANNA_USER_ID,
  verification: "unverified",
  facts: riannaFacts,
  decisions: riannaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: riannaExpected(formId),
    goldenPdfPath: lockedGoldenPath("rianna", formId),
  })),
};
