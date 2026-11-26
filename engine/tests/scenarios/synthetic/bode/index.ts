/*
 * A made-up single filer in San Diego (README.md): a distribution of trust
 * income kept for seven years while her interest was contingent, averaged
 * over 2020 to 2024 (FTB 5870A Part II Section A and Part III; Form 540 lines
 * 34 and 62; Schedule CA line 8z column C). UNVERIFIED: no answer key; the
 * expected values are engine output checked by hand, so a failure means "the
 * engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { bodeDecisions } from "./decisions.js";
import { bodeExpected } from "./expected.js";
import { BODE_TAX_YEAR, BODE_USER_ID, bodeFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = ["form-8959", "schedule-2", "form-1040", "schedule-ca", "form-5870a", "form-540"];

export const bodeScenario: Scenario = {
  name: "bode",
  description:
    "Single San Diego filer: $300,000 of trust income kept seven years while her interest was contingent, averaged over 2020 to 2024 with one nonresident year (FTB 5870A Parts II and III, Form 540 lines 34 and 62, Schedule CA line 8z).",
  verification: "unverified",
  taxYear: BODE_TAX_YEAR,
  userId: BODE_USER_ID,
  facts: bodeFacts,
  decisions: bodeDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: bodeExpected(formId),
    goldenPdfPath: lockedGoldenPath("bode", formId),
  })),
};
