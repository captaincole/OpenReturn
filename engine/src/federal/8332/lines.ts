/*
 * Form 8332 rules with no fact reading: which years a part names, when a
 * release or a revocation counts for the tax year, and what each copy prints.
 * The form has no arithmetic; its only "math" is the years.
 */

import type {
  Form8332ReleaseFactValue,
  Form8332RevocationFactValue,
  Form8332Years,
} from "../../facts/index.js";
import { ssnOf, type SSN } from "../../values.js";

/* The return's tax year: Part I's "for the tax year 20__" on a release made for this return. */
export const TAX_YEAR = 2025;

/* "Write the specific future year(s) or 'all future years'" (irs-8332-form-2025::sec::part-ii::b01). */
export const ALL_FUTURE_YEARS_TEXT = "all future years";

/* Part I prints the last two digits after the printed "20" (the field holds 2 characters). */
export function partIYearDigits(year: number): string {
  return String(year).slice(-2);
}

/* Consecutive years as runs: [2026, 2027, 2028, 2030] → [[2026, 2028], [2030, 2030]]. */
function yearRuns(years: readonly number[]): Array<[number, number]> {
  const sorted = [...new Set(years)].sort((earlier, later) => earlier - later);
  const runs: Array<[number, number]> = [];
  for (const year of sorted) {
    const last = runs[runs.length - 1];
    if (last !== undefined && last[1] === year - 1) last[1] = year;
    else runs.push([year, year]);
  }
  return runs;
}

/* A run of three or more years reads "A through B"; two years stay two entries. */
function runText([first, last]: [number, number]): string[] {
  if (first === last) return [String(first)];
  if (last === first + 1) return [String(first), String(last)];
  return [`${first} through ${last}`];
}

/*
 * The years as a part prints them: "2026", "2026 and 2027", "2026 through
 * 2028", "2026, 2028 and 2030", or "all future years". The instructions'
 * example writes a run as "2023 through 2027" (irs-8332-form-2025::sec::part-iii::b01).
 * Undefined for an empty list.
 */
export function yearsText(years: Form8332Years): string | undefined {
  if (years === "all_future_years") return ALL_FUTURE_YEARS_TEXT;
  const runs = yearRuns(years).flatMap(runText);
  if (runs.length <= 1) return runs[0];
  return `${runs.slice(0, -1).join(", ")} and ${runs[runs.length - 1]}`;
}

/* Whether the years name `year`; "all future years" means every year after `writtenIn`. */
export function yearsInclude(years: Form8332Years, year: number, writtenIn: number): boolean {
  return years === "all_future_years" ? year > writtenIn : years.includes(year);
}

/* Part I's year: the one the fact names, else the tax year (the release this return relies on). */
export const partIYearOf = (release: Form8332ReleaseFactValue, taxYear = TAX_YEAR): number =>
  release.currentYear ?? taxYear;

/*
 * A release counts for the year when Part I names it, or Part II does ("Use
 * Part I to release a claim to the exemption for the current year. Use Part II
 * if you choose to release a claim to exemption for any future year(s)",
 * irs-8332-form-2025::sec::part-i-release-of-claim-to-exemption-for-current-year::b02).
 * Part II's "all future years" are the years after Part I's.
 */
export function releaseCovers(release: Form8332ReleaseFactValue, taxYear = TAX_YEAR): boolean {
  const partIYear = partIYearOf(release, taxYear);
  if (partIYear === taxYear) return true;
  return release.futureYears !== undefined && yearsInclude(release.futureYears, taxYear, partIYear);
}

/*
 * The first year a revocation can take effect: "no earlier than the tax year
 * following the year you provide the noncustodial parent with a copy of the
 * revocation" (irs-8332-form-2025::sec::part-iii::b01). For 2025 the copy must
 * have gone "in 2024 or earlier" (irs-pub-501-2025::sec::support-test-for-children-of::b08).
 */
export const firstEffectiveYear = (revocation: Form8332RevocationFactValue): number =>
  revocation.givenYear + 1;

/*
 * A revocation counts for the year when Part III names it and the year is not
 * before its first effective year. The instructions' example: given in 2025
 * for 2023 through 2027, it "will be effective for 2026 and 2027"
 * (irs-8332-form-2025::sec::part-iii::b01). "All future years" are the years
 * after the year the copy was given.
 */
export function revocationEffectiveFor(
  revocation: Form8332RevocationFactValue,
  taxYear = TAX_YEAR,
): boolean {
  return (
    taxYear >= firstEffectiveYear(revocation) &&
    yearsInclude(revocation.revokedYears, taxYear, revocation.givenYear)
  );
}

/* One part's three entries. An SSN is undefined while the answer is missing. */
export interface Form8332Part {
  childName: string;
  /* Part I: the two digits after "20"; Parts II and III: the years as written. */
  years: string | undefined;
  custodialParentSsn: SSN | undefined;
}

/* What one copy of the form prints, for one child. */
export interface Form8332Copy {
  kind: "release" | "revocation";
  dependentKey: string;
  /* The form8332.<kind>.<slug> fact this copy reads (it may be missing). */
  factKey: string;
  noncustodialParentName: string | undefined;
  noncustodialParentSsn: SSN | undefined;
  partI?: Form8332Part;
  partII?: Form8332Part;
  partIII?: Form8332Part;
  /* Why the copy cannot be printed (one sentence); every field is then a gap. */
  gap?: string;
}

/* A filer as the form names them. */
export interface Form8332Person {
  name: string | undefined;
  ssn: SSN | undefined;
}

export const noReleaseForYear = (childName: string, taxYear = TAX_YEAR) =>
  `The Form 8332 recorded for ${childName} names ${taxYear} in neither Part I nor Part II, but the dependent answer says the custodial parent released the claim for ${taxYear}.`;

/*
 * The copy a noncustodial parent attaches: the header names this filer (the
 * child's parent), Parts I and II are the custodial parent's release. With no
 * release fact yet, Part I's year shows and the rest waits.
 */
export function releaseCopy(args: {
  dependentKey: string;
  factKey: string;
  childName: string;
  noncustodialParent: Form8332Person;
  release: Form8332ReleaseFactValue | undefined;
  taxYear?: number;
}): Form8332Copy {
  const { release, childName, taxYear = TAX_YEAR } = args;
  const base = {
    kind: "release" as const,
    dependentKey: args.dependentKey,
    factKey: args.factKey,
    noncustodialParentName: args.noncustodialParent.name,
    noncustodialParentSsn: args.noncustodialParent.ssn,
  };
  if (release === undefined) {
    return {
      ...base,
      partI: { childName, years: partIYearDigits(taxYear), custodialParentSsn: undefined },
    };
  }
  if (!releaseCovers(release, taxYear))
    return { ...base, gap: noReleaseForYear(childName, taxYear) };
  const custodialParentSsn = ssnOf(release.custodialParentSsn);
  return {
    ...base,
    partI: {
      childName,
      years: partIYearDigits(partIYearOf(release, taxYear)),
      custodialParentSsn,
    },
    partII:
      release.futureYears === undefined
        ? undefined
        : { childName, years: yearsText(release.futureYears), custodialParentSsn },
  };
}

/*
 * The copy a custodial parent attaches after a revocation: the header names
 * the other parent, Part III is this filer's revocation ("Complete Part III if
 * you are revoking a previous release", irs-8332-form-2025::sec::part-iii::b01).
 */
export function revocationCopy(args: {
  dependentKey: string;
  factKey: string;
  childName: string;
  custodialParent: Form8332Person;
  revocation: Form8332RevocationFactValue;
}): Form8332Copy {
  const { revocation, childName } = args;
  return {
    kind: "revocation",
    dependentKey: args.dependentKey,
    factKey: args.factKey,
    noncustodialParentName: `${revocation.noncustodialParentFirstName} ${revocation.noncustodialParentLastName}`,
    noncustodialParentSsn: ssnOf(revocation.noncustodialParentSsn),
    partIII: {
      childName,
      years: yearsText(revocation.revokedYears),
      custodialParentSsn: args.custodialParent.ssn,
    },
  };
}
