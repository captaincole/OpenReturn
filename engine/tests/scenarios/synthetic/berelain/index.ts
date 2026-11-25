/*
 * A made-up single filer in Texas (README.md): a sign and print shop that sold
 * its building, land, improvements, a van, a hay field, a press, a laptop and
 * retired an HVAC unit, with section 179 and listed-property recapture (Form
 * 4797, all four parts). Federal only. UNVERIFIED: no answer key; the expected
 * values are engine output checked by hand, so a failure means "the engine
 * changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { berelainDecisions } from "./decisions.js";
import { berelainExpected } from "./expected.js";
import { BERELAIN_TAX_YEAR, BERELAIN_USER_ID, berelainFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-4797",
  "schedule-b",
  "schedule-c",
  "schedule-se",
  "schedule-d",
  "form-8995",
  "schedule-1",
  "schedule-2",
  "form-1040",
];

export const berelainScenario: Scenario = {
  name: "berelain",
  description:
    "Single TX filer: a print shop's building, land and equipment sold, section 179 and 280F recapture (Form 4797 Parts I–IV; Schedule D lines 11 and 19, Schedule 1 line 4, Schedule C line 6, the Schedule D Tax Worksheet on 1040 line 16).",
  verification: "unverified",
  taxYear: BERELAIN_TAX_YEAR,
  userId: BERELAIN_USER_ID,
  facts: berelainFacts,
  decisions: berelainDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: berelainExpected(formId),
    goldenPdfPath: lockedGoldenPath("berelain", formId),
  })),
};
