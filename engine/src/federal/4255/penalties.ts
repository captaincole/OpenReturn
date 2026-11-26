/*
 * Form 4255 Part I columns (o) and (p): the prevailing wage and apprenticeship
 * penalties of Form 7220, split by the line's elective payment amounts
 * (irs-4255-inst-2025::sec::excessive-payments-eps-excessive-credit::b01, b02).
 */

import type { CreditRecaptureLineFactValue } from "../../facts/index.js";
import { roundDollars } from "../../money.js";

interface ElectivePaymentShares {
  a: number;
  b?: number;
  c?: number;
  d?: number;
}

const positive = (value: number): number | undefined => (value > 0 ? value : undefined);

/*
 * DECISION (2026-11-25, by the author): the part of a penalty that the elective
 * payment amounts do not take goes in column (3), so the three columns add up to
 * the penalty.
 * Text A, the ratios: "Net EPE ratio = Part I, column (d) / Part I, column (a)
 * ... Non-net EPE ratio = Part I, column (c) / Part I, column (a) ... Non-EPE
 * ratio = Part I, column (e) / Part I, column (a)"
 * (irs-4255-inst-2025::sec::excessive-payments-eps-excessive-credit::b02).
 * Text B: "If you do not have an EPE enter the full penalty amounts in columns
 * (o)(3) and/or (p)(3)" (the same block), and the example, where the ratios
 * take the whole $5,000 (::net-epe::b01). With a carryover in column (f), the
 * three ratios of Text A add up to less than 1 and part of the penalty would be
 * on no column.
 * The engine follows Text B for the rest: columns (1) and (2) take the ratios
 * of Text A, and column (3) is the penalty less both. A penalty is owed in full,
 * and the example's arithmetic is the same either way.
 */
function splitOne(penalty: number, shares: ElectivePaymentShares): [number, number, number] {
  if ((shares.b ?? 0) === 0 || shares.a === 0) return [0, 0, penalty];
  const net = roundDollars((penalty * (shares.d ?? 0)) / shares.a);
  const nonNet = roundDollars((penalty * (shares.c ?? 0)) / shares.a);
  return [net, nonNet, penalty - net - nonNet];
}

/* Columns (o)(1)–(o)(3) and (p)(1)–(p)(3); blank where 0. */
export function splitPenalty(fact: CreditRecaptureLineFactValue, shares: ElectivePaymentShares) {
  const [o1, o2, o3] = splitOne(roundDollars(fact.prevailingWagePenalty ?? 0), shares);
  const [p1, p2, p3] = splitOne(roundDollars(fact.apprenticeshipPenalty ?? 0), shares);
  return {
    o1: positive(o1),
    o2: positive(o2),
    o3: positive(o3),
    p1: positive(p1),
    p2: positive(p2),
    p3: positive(p3),
  };
}
