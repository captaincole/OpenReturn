/*
 * A made-up single filer in Sacramento (README.md): a landscape business sold
 * its equipment, a yard and the yard's improvements, with a section 179
 * recapture. California allowed less depreciation than the federal return, so
 * Schedule D-1 files: its ordinary gain is smaller (Schedule CA line 4 column B)
 * and its section 1231 gain larger (Schedule D (540) line 1, Schedule CA line 7a
 * column C). UNVERIFIED: no answer key; the expected values are engine output
 * checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { tylinDecisions } from "./decisions.js";
import { tylinExpected } from "./expected.js";
import { TYLIN_TAX_YEAR, TYLIN_USER_ID, tylinFacts } from "./facts.js";

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

export const tylinScenario: Scenario = {
  name: "tylin",
  description:
    "Single Sacramento filer: a landscape business's equipment, yard and improvements sold, with less California depreciation (Schedule D-1 Parts I–IV; Schedule CA lines 3, 4 and 7a; Schedule D (540) line 1).",
  verification: "unverified",
  taxYear: TYLIN_TAX_YEAR,
  userId: TYLIN_USER_ID,
  facts: tylinFacts,
  decisions: tylinDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: tylinExpected(formId),
    goldenPdfPath: lockedGoldenPath("tylin", formId),
  })),
};
