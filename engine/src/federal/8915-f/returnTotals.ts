/*
 * What the Forms 8915-F of a return send to Form 1040 lines 4b and 5b, and
 * what they take off Form 5329 line 1.
 */

import { sum } from "../../money.js";
import { taxableShare, type NamedPiece } from "./designations.js";
import type { Form8915FCopy, Form8915FReturn } from "./filingInfo.js";
import { partIIIOf } from "./partIII.js";

/*
 * The taxable part of the 1099-Rs a form takes over: each Part I qualified
 * amount and each Part IV distribution. Form 8606 takes the traditional IRA
 * part of a person with IRA basis (Form 1040 line 4b reads Form 8606 line 15c)
 * and the Roth IRA part (line 25b comes off on line 4b).
 */
function takenFromRows(copy: Form8915FCopy) {
  const { figure } = copy;
  const partI = figure.partI;
  const fromPartI = (partI?.pieces ?? []).map((piece, index) => ({
    piece,
    taken: taxableShare(piece.row, partI?.qualified[index] ?? 0),
  }));
  const fromPartIV = (figure.partIV?.pieces ?? []).map((piece) => ({
    piece,
    taken: taxableShare(piece.row, piece.amount),
  }));
  const entries = [...fromPartI, ...fromPartIV].filter(
    ({ piece }) => !(piece.line === "traditional" && copy.onForm8606.traditional),
  );
  const total = (pick: (piece: NamedPiece) => boolean) =>
    sum(...entries.filter(({ piece }) => pick(piece)).map(({ taken }) => taken));
  return {
    ira: total((piece) => piece.line !== "plan"),
    pension: total((piece) => piece.line === "plan"),
  };
}

/*
 * Form 1040 line 5b takes line 15 and the plan part of line 32; line 4b takes
 * line 26 and the IRA part of line 32 (the form, lines 15, 26 and 32). A form
 * whose Part III reads Form 8606 leaves line 26 to the Form 1040 binding.
 */
export function returnTotals(copies: readonly Form8915FCopy[]): Form8915FReturn {
  const reads8606 = copies.find((copy) => copy.onForm8606.traditional || copy.onForm8606.roth);
  const parts = copies.map((copy) => {
    const taken = takenFromRows(copy);
    const partIII = reads8606 === copy ? undefined : partIIIOf(copy.figure, copy.onForm8606);
    const partIV = copy.figure.partIV?.lines;
    return {
      taken,
      ira: sum(partIII?.line26, partIV?.line32FromIra),
      pension: sum(copy.figure.partII.line15, partIV?.line32FromPlan),
    };
  });
  return {
    ira: {
      takenFromRows: sum(...parts.map((part) => part.taken.ira)),
      income: sum(...parts.map((part) => part.ira)),
    },
    pension: {
      takenFromRows: sum(...parts.map((part) => part.taken.pension)),
      income: sum(...parts.map((part) => part.pension)),
    },
    partIIIFromForm8606: reads8606?.onForm8606,
  };
}

/*
 * Form 5329 line 1 counts "early distributions includible in income (other
 * than qualified disaster recovery distributions)" (irs-5329-inst-2025::sec::line-1::b01),
 * and a Part IV qualified distribution is not subject to the tax except the
 * part on line 32 (irs-8915f-inst-2025::sec::the-additional-tax-and-qualified-distributions::b01),
 * the part not repaid. The amount of each 1099-R to leave off line 1, by fact key.
 */
export function earlyDistributionExclusions(copies: readonly Form8915FCopy[]): Map<string, number> {
  const excluded = new Map<string, number>();
  const add = (key: string, amount: number) => excluded.set(key, (excluded.get(key) ?? 0) + amount);
  for (const { figure } of copies) {
    const partI = figure.partI;
    partI?.pieces.forEach((piece, index) =>
      add(piece.key, taxableShare(piece.row, partI.qualified[index])),
    );
    for (const piece of figure.partIV?.pieces ?? [])
      add(piece.key, Math.min(piece.repaid, taxableShare(piece.row, piece.amount)));
  }
  return excluded;
}
