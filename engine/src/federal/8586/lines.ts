/*
 * Form 8586, Low-Income Housing Credit: the arithmetic of lines 1 to 5, pure.
 * An amount is a Form 3800 cell (3800/cells.ts): a number, blank, or a gap
 * that passes through every line that adds it.
 *
 * Lines 6 and 7 are for estates and trusts: "Estates and trusts, go to line
 * 6. ... All others, stop here and report this amount on Form 3800, Part III,
 * line 4d" (irs-8586-form-2025::sec::face-page-1::b01). An individual's return
 * leaves them blank.
 */

import { addCells, firstGap, type Cell } from "../3800/cells.js";

/* Line 2 prints four BINs, (i) to (iv); "If you need more space, attach a schedule" (face-page-1::b01). */
export const LINE_2_BIN_ROWS = 4;

/* One Form 8609-A as Form 8586 reads it (8609-a/credits.ts). */
export interface BuildingOnForm8586 {
  buildingIdentificationNumber: string;
  /* Item E of the Form 8609-A: the qualified basis decreased in 2025. */
  qualifiedBasisDecreased: boolean;
  /* Line 18 of the Form 8609-A; undefined while the copy waits on its fact. */
  credit: Cell;
}

export interface Form8586Lines {
  /* Line 1: "Number of Forms 8609-A attached". */
  line1: number;
  /* Line 2: Yes when the qualified basis of any building on line 1 decreased. */
  line2Decreased: boolean;
  /* Line 2 (i) and after: the BINs of the buildings that had a decreased basis, in copy order. */
  decreasedBins: string[];
  /* Line 3: the total of line 18 of every Form 8609-A; blank with none or while one waits. */
  line3: Cell;
  /* Line 4: the credit from partnerships, S corporations, estates and trusts; blank with none. */
  line4: Cell;
  /* Line 5: "Add lines 3 and 4"; blank while line 3 waits. */
  line5: Cell;
}

/*
 * Line 3: "The credit for the year is figured on Form 8609-A for each
 * building. ... Enter on line 3 the total credit for attached Form(s) 8609-A"
 * (irs-8586-form-2025::sec::line-3::b01). A gap on any copy is a gap here;
 * a copy that waits leaves the total blank, so no credit drops out of it.
 */
export function line3Of(credits: ReadonlyArray<Cell>): Cell {
  const gap = firstGap(credits);
  if (gap) return gap;
  if (credits.length === 0 || credits.some((credit) => credit === undefined)) return undefined;
  return addCells(...credits);
}

/* Line 5: "Add lines 3 and 4" (face-page-1::b01). Blank while a Form 8609-A waits. */
export function line5Of(line3: Cell, line4: Cell, waiting: boolean): Cell {
  const gap = firstGap([line3, line4]);
  if (gap) return gap;
  return waiting ? undefined : addCells(line3, line4);
}

/*
 * Lines 1 to 5 from the Forms 8609-A and line 4. Line 2: "Has there been a
 * decrease in the qualified basis of any buildings accounted for on line 1
 * since the close of the preceding tax year? ... If 'Yes,' enter the building
 * identification numbers (BINs) of the buildings that had a decreased basis"
 * (face-page-1::b01). Item E of each Form 8609-A answers the same question for
 * its building (irs-8609a-inst-2025::sec::specific-instructions::b02).
 */
export function form8586LinesOf(
  buildings: ReadonlyArray<BuildingOnForm8586>,
  line4: Cell,
): Form8586Lines {
  const credits = buildings.map((building) => building.credit);
  const waiting = credits.some((credit) => credit === undefined);
  const decreased = buildings.filter((building) => building.qualifiedBasisDecreased);
  const line3 = line3Of(credits);
  return {
    line1: buildings.length,
    line2Decreased: decreased.length > 0,
    decreasedBins: decreased.map((building) => building.buildingIdentificationNumber),
    line3,
    line4,
    line5: line5Of(line3, line4, waiting),
  };
}
