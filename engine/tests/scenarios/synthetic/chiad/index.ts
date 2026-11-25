/*
 * A made-up single filer in Florida (README.md): a W-2 and two installment
 * sales of capital assets in 2025 (Form 6252, two copies): her main home, with
 * an excluded gain and a mortgage over basis, and a sculpture held less than a
 * year. The results reach Schedule D lines 4 and 11. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { chiadDecisions } from "./decisions.js";
import { chiadExpected } from "./expected.js";
import { CHIAD_TAX_YEAR, CHIAD_USER_ID, chiadFacts } from "./facts.js";

const FORM_IDS = ["form-6252", "schedule-d", "form-8960", "schedule-2", "form-1040"];

export const chiadScenario: Scenario = {
  name: "chiad",
  description:
    "Single FL filer: a main home and a sculpture sold on installments in 2025 (Form 6252 lines 15 and 20, two copies; Schedule D lines 4 and 11).",
  verification: "unverified",
  taxYear: CHIAD_TAX_YEAR,
  userId: CHIAD_USER_ID,
  facts: chiadFacts,
  decisions: chiadDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: chiadExpected(formId),
    goldenPdfPath: lockedGoldenPath("chiad", formId),
  })),
};
