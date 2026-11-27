/*
 * A made-up married couple in Nevada (README.md): two W-2s, no children, and
 * an earlier EIC denial. Form 8862 Parts I and II, Section B (the filer
 * without a qualifying child), and Form 1040 line 27a. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked
 * by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { ghealdanDecisions } from "./decisions.js";
import { ghealdanExpected } from "./expected.js";
import { GHEALDAN_TAX_YEAR, GHEALDAN_USER_ID, ghealdanFacts } from "./facts.js";

const FORM_IDS = ["form-8862", "form-1040"];

export const ghealdanScenario: Scenario = {
  name: "ghealdan",
  description:
    "MFJ NV couple, no children, EIC denied in an earlier year (Form 8862 Part II Section B: days, ages, dependents; Form 1040 line 27a).",
  verification: "unverified",
  taxYear: GHEALDAN_TAX_YEAR,
  userId: GHEALDAN_USER_ID,
  facts: ghealdanFacts,
  decisions: ghealdanDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: ghealdanExpected(formId),
    goldenPdfPath: lockedGoldenPath("ghealdan", formId),
  })),
};
