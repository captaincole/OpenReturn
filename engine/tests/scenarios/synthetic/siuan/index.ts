/*
 * A made-up single filer in Nevada (README.md): the beneficiary of a parent
 * born before 1936 who takes a lump-sum distribution with every Form 4972
 * branch that one return can show: the 20% capital gain election, the 10-year
 * tax option, NUA included, a death benefit exclusion, federal estate tax and
 * an annuity contract. Federal only. UNVERIFIED: no answer key; the expected
 * values are engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { siuanDecisions } from "./decisions.js";
import { siuanExpected } from "./expected.js";
import { SIUAN_TAX_YEAR, SIUAN_USER_ID, siuanFacts } from "./facts.js";

const FORM_IDS = ["form-4972", "schedule-1-a", "form-1040"];

export const siuanScenario: Scenario = {
  name: "siuan",
  description:
    "Single NV filer, a beneficiary's lump-sum distribution on Form 4972: 20% capital gain election, 10-year tax option, NUA, death benefit exclusion, estate tax, annuity (Form 1040 line 16 box 2).",
  verification: "unverified",
  taxYear: SIUAN_TAX_YEAR,
  userId: SIUAN_USER_ID,
  facts: siuanFacts,
  decisions: siuanDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: siuanExpected(formId),
    goldenPdfPath: lockedGoldenPath("siuan", formId),
  })),
};
