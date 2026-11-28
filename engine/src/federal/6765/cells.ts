/*
 * A Form 6765 figure as a binding returns it: the facts-layer gap (lines.ts
 * FigureGap) becomes an unsupported result with the same reason.
 */

import { unsupported, type Unsupported } from "../../types.js";
import { isFigureGap, type FigureGap } from "./lines.js";

export function asCell<T>(
  value: T | FigureGap | undefined,
): Exclude<T, FigureGap> | Unsupported | undefined {
  if (value === undefined) return undefined;
  if (isFigureGap(value)) return unsupported(value.gap);
  return value as Exclude<T, FigureGap>;
}
