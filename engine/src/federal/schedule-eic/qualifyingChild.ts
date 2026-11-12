/*
 * The EIC's qualifying child, from irs-1040-inst-2025::sec::step-2-2::b01: the
 * relationship test (the same list as the child tax credit), the age test
 * (under 19 and younger than the taxpayer; under 24, a full-time student and
 * younger; or any age and permanently and totally disabled) and the residency
 * test (lived with the taxpayer in the United States more than half the year).
 * The joint return test is Cade's conversation: a dependent fact is a person
 * the taxpayer claims. Undefined while an answer the test needs is missing.
 */

import {
  ageAtYearEnd,
  isQualifyingChildRelationship,
  livedWithTaxpayerOverHalfYear,
  type DependentFactValue,
} from "../../facts/index.js";

/* MM/DD/YYYY as a sortable number (YYYYMMDD); undefined when unreadable. */
function dateKey(date: string | undefined): number | undefined {
  const parts = date?.trim().split("/").map(Number);
  if (parts?.length !== 3 || parts.some((part) => !Number.isFinite(part))) return undefined;
  const [month, day, year] = parts as [number, number, number];
  return year * 10000 + month * 100 + day;
}

function passesAgeTest(
  child: DependentFactValue,
  taxpayerDob: string | undefined,
  taxYear: number,
): boolean | undefined {
  if (child.permanentlyDisabled === true) return true;
  const age = ageAtYearEnd(child.dob, taxYear);
  if (age === undefined) return undefined;
  const childBorn = dateKey(child.dob);
  const taxpayerBorn = dateKey(taxpayerDob);
  const younger =
    childBorn === undefined || taxpayerBorn === undefined ? undefined : childBorn > taxpayerBorn;
  if (age < 19) return younger;
  if (age < 24 && child.fullTimeStudent === undefined) return undefined;
  if (age < 24 && child.fullTimeStudent) return younger;
  return child.permanentlyDisabled === undefined ? undefined : false;
}

export function isEicQualifyingChild(
  child: DependentFactValue,
  taxpayerDob: string | undefined,
  taxYear: number,
): boolean | undefined {
  if (!isQualifyingChildRelationship(child.relationship)) return false;
  const overHalfYear = livedWithTaxpayerOverHalfYear(child, taxYear);
  const residency =
    overHalfYear === undefined || child.livedInUs === undefined
      ? undefined
      : overHalfYear && child.livedInUs;
  if (residency === false) return false;
  const age = passesAgeTest(child, taxpayerDob, taxYear);
  if (age === false) return false;
  return age === undefined || residency === undefined ? undefined : true;
}
