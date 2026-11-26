/*
 * Reading one printed Form 8915-F from the filing info: the copy, its gaps, and
 * the text of names and dates.
 */

import type { QualifiedDisaster } from "../../facts/index.js";
import { unsupported, type Unsupported } from "../../types.js";
import { ISODate, isoDate } from "../../values.js";
import type { Form8915FCopy, Form8915FFilingInfo } from "./filingInfo.js";
import type { Answer } from "./parts.js";

type Printed<T> = T | Unsupported | undefined;

export function copyOf(info: Form8915FFilingInfo): Form8915FCopy | undefined {
  return info.form8915FCopies?.[info.form8915FCopyIndex ?? 0];
}

/* A line of the printed form: unsupported with the form's gap, blank with no copy. */
export function lineOf<T>(
  pick: (copy: Form8915FCopy) => T | undefined,
): (form: unknown, info: Form8915FFilingInfo) => Printed<T> {
  return (_, info) => {
    if (info.form8915FGap) return unsupported(info.form8915FGap);
    const copy = copyOf(info);
    return copy === undefined ? undefined : pick(copy);
  };
}

/* A Yes or No box: checked when the answer matches, else blank. */
export const box = (answer: Answer | undefined, wanted: Answer): true | undefined =>
  answer === wanted ? true : undefined;

export const usDate = (date: string | undefined): string | undefined =>
  date === undefined ? undefined : ISODate.usSlash(isoDate(date));

/* "Date(s) of distribution(s) made this year": each date once, in order. */
export function datesText(dates: readonly string[]): string | undefined {
  const unique = [...new Set(dates)].sort();
  return unique.length === 0 ? undefined : unique.map((date) => usDate(date)).join(", ");
}

type DisasterField = "femaNumber" | "declarationDate" | "beginningDate" | "endingDate";

/* One cell of a disaster table: row 1 or 2. */
export function tableCell(
  disasters: readonly QualifiedDisaster[] | undefined,
  row: number,
  field: DisasterField,
): string | undefined {
  const disaster = disasters?.[row];
  if (!disaster) return undefined;
  return field === "femaNumber" ? disaster.femaNumber : usDate(disaster[field]);
}
