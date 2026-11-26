/*
 * More than four Part II properties: "If you need to list additional
 * properties, complete and attach additional Forms 4255"
 * (irs-4255-inst-2025::sec::part-ii::b01). Copy n prints the properties 4n to
 * 4n + 3 in columns A to D, and its lines 18 to 20 add those columns, as the
 * form's lines say ("Add property columns A through D"). Part I, which adds
 * every property, and Part III print on the first copy only; the header
 * prints on each copy.
 */

import type { Form4255Result } from "./filingInfo.js";
import type { PropertyLines } from "./lines.js";

export const PROPERTIES_PER_COPY = 4;

/* The copies the form needs: one for each four properties, at least one. */
export function form4255CopyCount(result: Form4255Result | undefined): number {
  const properties = result?.properties.length ?? 0;
  let copies = 1;
  while (copies * PROPERTIES_PER_COPY < properties) copies += 1;
  return copies;
}

/* The properties one copy prints in columns A to D. */
export const propertiesOnCopy = (
  result: Form4255Result,
  copyIndex: number,
): ReadonlyArray<PropertyLines> =>
  result.properties.slice(copyIndex * PROPERTIES_PER_COPY, (copyIndex + 1) * PROPERTIES_PER_COPY);
