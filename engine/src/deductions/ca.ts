/*
 * The California itemized total, as Schedule CA Part II line 29 adds it: no
 * state income tax, no SALT cap, the 2% items, California's own investment
 * interest, then the high-AGI worksheet.
 */

import { sum } from "../money.js";
import { caItemizedLine29 } from "../state/ca/schedule-ca/itemizedWorksheet.js";
import { DEDUCTION_ITEMS, type ItemId } from "./catalog.js";
import { amountOf, counted, type ItemizedInput } from "./rules.js";

export interface CaItemizedInput extends ItemizedInput {
  /** FTB 3526 line 8 when California's investment interest differs from the federal. */
  caInvestmentInterest?: number;
}

const itemById = (id: ItemId) => DEDUCTION_ITEMS.find((item) => item.id === id)!;

export function caItemized(input: CaItemizedInput): number | undefined {
  const line28 = sum(
    ...DEDUCTION_ITEMS.map((item) =>
      item.id === "investment_interest" && input.caInvestmentInterest !== undefined
        ? input.caInvestmentInterest
        : counted(item.ca, amountOf(input.amounts, item.id), input.agi),
    ),
  );
  // Worksheet line 2 reads the federal Schedule A lines 4 and 9.
  return caItemizedLine29({
    line28,
    federalAgi: input.agi,
    filingStatus: input.filingStatus,
    scheduleALine4: counted(
      itemById("medical").federal,
      amountOf(input.amounts, "medical"),
      input.agi,
    ),
    scheduleALine9: amountOf(input.amounts, "investment_interest"),
    scheduleALine15: undefined,
    scheduleALine16: undefined,
  });
}
