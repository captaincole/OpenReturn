/*
 * One Form 4972 from its Form 1099-R amounts and the recipient's choices, and
 * the tax it adds to Form 1040 line 16.
 */

import { sum } from "../../money.js";
import {
  deathBenefitWorksheet,
  nuaWorksheet,
  partII,
  type DeathBenefitWorksheet,
  type LumpSumAmounts,
  type LumpSumChoices,
  type NuaWorksheet,
  type PartII,
} from "./lines.js";
import { partIII, type PartIII } from "./partIII.js";

export interface Form4972Lines {
  nua?: NuaWorksheet;
  deathBenefit?: DeathBenefitWorksheet;
  partII?: PartII;
  partIII?: PartIII;
  /* Line 30: lines 7 and 29; blank without Part III. */
  line30?: number;
  /*
   * The tax on Form 1040 line 16: line 30, or line 7 alone with Part II only
   * ("If you also choose to use Part III, go to line 8. Otherwise, include the
   * amount from line 7 in the total on Form 1040 ... line 16", the blank form).
   */
  tax: number;
}

export function form4972Lines(amounts: LumpSumAmounts, choices: LumpSumChoices): Form4972Lines {
  const nua = nuaWorksheet(amounts, choices);
  const deathBenefit = deathBenefitWorksheet(amounts, choices, nua);
  const two = partII(amounts, choices, nua, deathBenefit);
  const three = choices.tenYearOption
    ? partIII({ amounts, choices, nua, deathBenefit })
    : undefined;
  const line30 = three === undefined ? undefined : sum(two?.line7, three.line29);
  return {
    nua,
    deathBenefit,
    partII: two,
    partIII: three,
    line30,
    tax: line30 ?? two?.line7 ?? 0,
  };
}
