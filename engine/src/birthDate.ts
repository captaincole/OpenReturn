/* Age tests on a date of birth, as the 2025 forms word them. */

/* [year, month, day] of an MM/DD/YYYY or YYYY-MM-DD date; undefined when unreadable. */
function birthDateParts(dob: string | undefined): [number, number, number] | undefined {
  const us = dob?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const iso = dob?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const ymd = us ? [us[3], us[1], us[2]] : iso ? [iso[1], iso[2], iso[3]] : undefined;
  if (!ymd) return undefined;
  const [year, month, day] = ymd.map(Number);
  return [year, month, day];
}

/*
 * Born before January 2 of the given year: a January 1 birthday counts as the
 * day before. Undefined when the date of birth is missing or unreadable.
 */
export function bornBeforeJan2Of(dob: string | undefined, cutoffYear: number): boolean | undefined {
  const parts = birthDateParts(dob);
  if (!parts) return undefined;
  const [year, month, day] = parts;
  return year < cutoffYear || (year === cutoffYear && month === 1 && day < 2);
}

/*
 * 65 or older at the end of 2025 (1040 line 12d). CA 540 line 9 counts a
 * January 1, 1961 birthday as 65 on December 31. Tax year 2025 only.
 */
export function bornBeforeJan2_1961(dob: string | undefined): boolean | undefined {
  return bornBeforeJan2Of(dob, 1961);
}

/* 55 or older at the end of 2025: the HSA additional contribution (Form 8889 line 3). Tax year 2025 only. */
export function bornBeforeJan2_1971(dob: string | undefined): boolean | undefined {
  return bornBeforeJan2Of(dob, 1971);
}

/* One date as a number that sorts by date: 1965-07-01 is 19650701. */
const dateNumber = (year: number, month: number, day: number) => year * 10000 + month * 100 + day;

/*
 * Age 59½ in 2025, read as 6 calendar months after the 59th birthday (no
 * corpus block gives the day; the boundary dates may be one day off). Born on
 * or before July 1, 1965: 59½ by January 1, 2025, so all of
 * 2025. Born on or after July 1, 1966: under 59½ all of 2025. "during" is a
 * person who reaches 59½ in 2025. Undefined when the date is unreadable.
 * Tax year 2025 only.
 */
export function age59AndAHalfIn2025(
  dob: string | undefined,
): "all_year" | "during" | "not_reached" | undefined {
  const parts = birthDateParts(dob);
  if (!parts) return undefined;
  const born = dateNumber(...parts);
  if (born <= dateNumber(1965, 7, 1)) return "all_year";
  return born >= dateNumber(1966, 7, 1) ? "not_reached" : "during";
}
