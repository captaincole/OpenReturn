/* Age tests on a date of birth, as the 2025 forms word them. */

/* Born before January 2 of the given year: a January 1 birthday counts as the day before. */
function bornBeforeJan2Of(dob: string | undefined, cutoffYear: number): boolean | undefined {
  const us = dob?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const iso = dob?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const ymd = us ? [us[3], us[1], us[2]] : iso ? [iso[1], iso[2], iso[3]] : undefined;
  if (!ymd) return undefined;
  const [year, month, day] = ymd.map(Number);
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

/*
 * Form 8880's Caution: a person born after January 1, 2008 cannot take the
 * saver's credit (irs-8880-form-2025::sec::who-can-take-this-credit::b01).
 * Tax year 2025 only.
 */
export function bornBeforeJan2_2008(dob: string | undefined): boolean | undefined {
  return bornBeforeJan2Of(dob, 2008);
}
