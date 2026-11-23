/*
 * A made-up single taxpayer in Washington (README.md): a limited partner who
 * sold his whole partnership interest in 2025. The final K-1 (Form 1065) has a
 * business loss, and $9,000 of passive losses were carried from 2024. With the
 * gain on the sale the activity still has an overall loss, so it is not
 * entered on Form 8582: every loss is allowed in full, in Schedule E line 28
 * column (g), the carried loss on its own "PYA" row, and the gain is on Form
 * 8949 box F and Schedule D line 10.
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { bayleDecisions } from "./decisions.js";
import { bayleExpected } from "./expected.js";
import { BAYLE_TAX_YEAR, BAYLE_USER_ID, bayleFacts } from "./facts.js";

const FORM_IDS = ["form-8949", "schedule-d", "schedule-e", "schedule-1", "form-1040"];

export const bayleScenario: Scenario = {
  name: "bayle",
  description:
    "Single WA filer: a limited partner who sold his whole interest; the final K-1's loss and the carried passive loss are allowed in full (Schedule E column (g), the carried loss on a PYA row, line 27 Yes), with no Form 8582; the gain on Form 8949 box F.",
  verification: "unverified",
  taxYear: BAYLE_TAX_YEAR,
  userId: BAYLE_USER_ID,
  facts: bayleFacts,
  decisions: bayleDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: bayleExpected(formId),
    goldenPdfPath: lockedGoldenPath("bayle", formId),
  })),
};
