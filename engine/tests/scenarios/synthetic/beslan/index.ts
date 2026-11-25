/*
 * A made-up single filer in Fresno (README.md): a bakery sold its building,
 * land, an oven and a van, with a listed-property recapture. Credits moved the
 * federal and California bases apart, so Schedule D-1 files: its ordinary gain
 * is larger (Schedule CA line 4 column C) and its section 1231 gain smaller
 * (Schedule D (540) line 1, Schedule CA line 7a column B). The other branch of
 * tylin. UNVERIFIED: no answer key; the expected values are engine output
 * checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { beslanDecisions } from "./decisions.js";
import { beslanExpected } from "./expected.js";
import { BESLAN_TAX_YEAR, BESLAN_USER_ID, beslanFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-4797",
  "schedule-c",
  "schedule-se",
  "schedule-d",
  "form-8995-a",
  "schedule-1",
  "schedule-2",
  "form-1040",
  "schedule-d-1",
  "schedule-d-ca",
  "schedule-ca",
  "form-540",
];

export const beslanScenario: Scenario = {
  name: "beslan",
  description:
    "Single Fresno filer: a bakery's building, land and equipment sold, with California bases that differ from the federal ones (Schedule D-1; Schedule CA lines 3, 4 and 7a column C/B; Schedule D (540) line 12a).",
  verification: "unverified",
  taxYear: BESLAN_TAX_YEAR,
  userId: BESLAN_USER_ID,
  facts: beslanFacts,
  decisions: beslanDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: beslanExpected(formId),
    goldenPdfPath: lockedGoldenPath("beslan", formId),
  })),
};
