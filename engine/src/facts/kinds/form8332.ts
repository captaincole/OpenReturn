/*
 * Form 8332 answers, category dependents. "Attach a separate form for each
 * child" (irs-8332-form-2025::sec::form-8332-rev-december-2025::b01), so each
 * fact is one child's form, keyed by the child's dependent fact slug:
 *
 * - form8332.release.<dependentSlug>: the release the custodial parent signed
 *   and gave to this taxpayer, the noncustodial parent, who attaches it "each
 *   year the exemption is claimed" (part-i-release-of-claim-to-exemption-for-
 *   current-year::b02). The dependent fact's form8332Release answer says the
 *   release covers 2025; this fact holds what the signed form says.
 * - form8332.revocation.<dependentSlug>: Part III, a revocation this taxpayer,
 *   the custodial parent, gave the other parent. "You must attach a copy of
 *   the revocation to your tax return for each year you are claiming the
 *   exemption as a result of the revocation" (part-iii::b01).
 */

import { ssnOf } from "../../values.js";

type FactRow = { key: string; value: unknown; category: string };

/*
 * The years a part names: "Write the specific future year(s) or 'all future
 * years'" (irs-8332-form-2025::sec::part-ii::b01, part-iii::b01). A release
 * "can be for 1 year, for a number of specified years (for example, alternate
 * years), or for all future years" (irs-pub-501-2025::sec::residency-test::b10).
 */
export type Form8332Years = readonly number[] | "all_future_years";

/* Which filer is the child's parent; on a joint return it can be the spouse. Absent: the taxpayer. */
export type Form8332Parent = "taxpayer" | "spouse";

export interface Form8332ReleaseFactValue {
  /* The custodial parent's SSN, as written next to the signature in Part I and Part II. */
  custodialParentSsn: string;
  /*
   * Part I "for the tax year 20__": the year the custodial parent released in
   * Part I. Absent: 2025, the release this return relies on. A copy of a form
   * signed in an earlier year keeps that year (and names 2025 in Part II).
   */
  currentYear?: number;
  /* Part II: the future years released. Absent: Part II is blank. */
  futureYears?: Form8332Years;
  parent?: Form8332Parent;
}

export interface Form8332RevocationFactValue {
  /* The header: the noncustodial parent, the other parent of the child. */
  noncustodialParentFirstName: string;
  noncustodialParentLastName: string;
  noncustodialParentSsn: string;
  /* Part III: the years the release is revoked for. */
  revokedYears: Form8332Years;
  /*
   * The year the taxpayer gave the other parent a copy of the revocation, or
   * made a reasonable effort to. "The revocation will be effective no earlier
   * than the tax year following the year you provide the noncustodial parent
   * with a copy" (irs-8332-form-2025::sec::part-iii::b01).
   */
  givenYear: number;
  parent?: Form8332Parent;
}

export type Form8332FactKind = "release" | "revocation";

export interface Form8332Fact<T> {
  key: string;
  dependentSlug: string;
  value: T;
}

const FORM_8332_CATEGORY = "dependents";
const FORM_8332_PREFIX = "form8332";

export function makeForm8332FactKey(kind: Form8332FactKind, dependentSlug: string): string {
  return `${FORM_8332_PREFIX}.${kind}.${dependentSlug}`;
}

/* The dependent slug of a form8332.<kind>.<slug> key; undefined for any other key. */
function slugOf(key: string, kind: Form8332FactKind): string | undefined {
  const prefix = `${FORM_8332_PREFIX}.${kind}.`;
  if (!key.startsWith(prefix)) return undefined;
  const slug = key.slice(prefix.length);
  return slug === "" || slug.includes(".") ? undefined : slug;
}

export function isForm8332FactKey(key: string): boolean {
  return slugOf(key, "release") !== undefined || slugOf(key, "revocation") !== undefined;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isYear = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 1900;

export function isForm8332Years(value: unknown): value is Form8332Years {
  return value === "all_future_years" || (Array.isArray(value) && value.every(isYear));
}

const isParent = (value: unknown) =>
  value === undefined || value === "taxpayer" || value === "spouse";

/* Nine digits, with or without dashes: a malformed number is an answer still missing. */
const isSsn = (value: unknown) => typeof value === "string" && ssnOf(value) !== undefined;

function isRelease(value: Record<string, unknown>): boolean {
  return (
    isSsn(value.custodialParentSsn) &&
    (value.currentYear === undefined || isYear(value.currentYear)) &&
    (value.futureYears === undefined || isForm8332Years(value.futureYears)) &&
    isParent(value.parent)
  );
}

function isRevocation(value: Record<string, unknown>): boolean {
  return (
    typeof value.noncustodialParentFirstName === "string" &&
    typeof value.noncustodialParentLastName === "string" &&
    isSsn(value.noncustodialParentSsn) &&
    isForm8332Years(value.revokedYears) &&
    isYear(value.givenYear) &&
    isParent(value.parent)
  );
}

/* Each fact of one kind in the order recorded; a fact missing an answer is listed apart. */
function factsOfKind<T>(
  facts: ReadonlyArray<FactRow>,
  kind: Form8332FactKind,
  complete: (value: Record<string, unknown>) => boolean,
): { facts: Array<Form8332Fact<T>>; incompleteKeys: string[] } {
  const found: Array<Form8332Fact<T>> = [];
  const incompleteKeys: string[] = [];
  for (const row of facts) {
    const dependentSlug = slugOf(row.key, kind);
    if (row.category !== FORM_8332_CATEGORY || dependentSlug === undefined) continue;
    if (isRecord(row.value) && complete(row.value)) {
      found.push({ key: row.key, dependentSlug, value: row.value as unknown as T });
    } else {
      incompleteKeys.push(row.key);
    }
  }
  return { facts: found, incompleteKeys };
}

export const getForm8332ReleaseFacts = (facts: ReadonlyArray<FactRow>) =>
  factsOfKind<Form8332ReleaseFactValue>(facts, "release", isRelease);

export const getForm8332RevocationFacts = (facts: ReadonlyArray<FactRow>) =>
  factsOfKind<Form8332RevocationFactValue>(facts, "revocation", isRevocation);
