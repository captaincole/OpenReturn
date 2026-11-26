/*
 * Made-up taxpayer (README.md): a single full-year California resident with a
 * 2018 disaster loss and a 2020 general NOL carried over from 2024. FTB 3805V
 * Parts I to III limit them to her modified taxable income, and Schedule CA
 * (540) lines 9b1 and 9b2 take the deductions. No answer key: the expected
 * values are hand-checked, locked engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { masemaDecisions } from "./decisions.js";
import { masemaExpected } from "./expected.js";
import { MASEMA_TAX_YEAR, MASEMA_USER_ID, masemaFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = ["form-8949", "schedule-d", "form-1040", "schedule-ca", "form-3805v", "form-540"];

export const masemaScenario: Scenario = {
  name: "masema",
  description:
    "Single CA filer: W-2, interest, dividends and a net capital loss, with a 2018 disaster loss and a 2020 general NOL carried from 2024; FTB 3805V Parts I to III and Schedule CA lines 9b1 and 9b2.",
  taxYear: MASEMA_TAX_YEAR,
  userId: MASEMA_USER_ID,
  verification: "unverified",
  facts: masemaFacts,
  decisions: masemaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: masemaExpected(formId),
    goldenPdfPath: lockedGoldenPath("masema", formId),
  })),
};
