import type { ScheduleRFilingInfo } from "./filingInfo.js";

/* Part I: the one box that applies (specific-instructions::b01: "Only check one box"). */
export type PartIBox = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

type Person = "taxpayer" | "spouse";

/* "65": 65 or older. "disabled": under 65, retired on disability, with taxable disability income. */
export type PersonStatus = "65" | "disabled" | "not";

/*
 * A qualified individual (irs-1040sr-inst-2025::sec::qualified-individual::b01):
 * 65 or older at the end of 2025, or under 65, retired on permanent and total
 * disability, with taxable disability income. The retired answer is asked only
 * of a person under 65 with disability income (resolveInfo.ts). Undefined while
 * an answer is missing.
 */
export function personStatus(
  over65: boolean | undefined,
  disabilityIncome: number | undefined,
  retired: boolean | undefined,
): PersonStatus | undefined {
  if (over65 === true) return "65";
  if (over65 === undefined || disabilityIncome === undefined) return undefined;
  if (disabilityIncome <= 0) return "not";
  if (retired === undefined) return undefined;
  return retired ? "disabled" : "not";
}

function statusOf(info: ScheduleRFilingInfo, person: Person): PersonStatus | undefined {
  return person === "taxpayer"
    ? personStatus(
        info.taxpayerBornBeforeJan2_1961,
        info.scheduleRTaxpayerDisabilityIncome,
        info.scheduleRTaxpayerRetiredOnDisability,
      )
    : personStatus(
        info.spouseBornBeforeJan2_1961,
        info.scheduleRSpouseDisabilityIncome,
        info.scheduleRSpouseRetiredOnDisability,
      );
}

export function jointBox(taxpayer: PersonStatus, spouse: PersonStatus): PartIBox | null {
  const statuses = [taxpayer, spouse];
  const count = (status: PersonStatus) => statuses.filter((value) => value === status).length;
  if (count("65") === 2) return 3;
  if (count("65") === 1) return count("disabled") === 1 ? 6 : 7;
  if (count("disabled") === 2) return 5;
  return count("disabled") === 1 ? 4 : null;
}

/*
 * The Part I box from the filing status, the ages and the retired answers.
 * Null when no box applies; undefined while an answer is missing.
 */
export function partIBox(info: ScheduleRFilingInfo): PartIBox | null | undefined {
  const status = info.filingStatus;
  if (status === undefined) return undefined;
  const taxpayer = statusOf(info, "taxpayer");
  if (status === "married_filing_jointly") {
    const spouse = statusOf(info, "spouse");
    return taxpayer === undefined || spouse === undefined ? undefined : jointBox(taxpayer, spouse);
  }
  if (status === "married_filing_separately") {
    // married-persons::b01: a separate return claims the credit only after living apart all year.
    if (info.livedApartFromSpouseAllYear === false) return null;
    if (info.livedApartFromSpouseAllYear === undefined || taxpayer === undefined) return undefined;
    return taxpayer === "65" ? 8 : taxpayer === "disabled" ? 9 : null;
  }
  if (taxpayer === undefined) return undefined;
  return taxpayer === "65" ? 1 : taxpayer === "disabled" ? 2 : null;
}

/* The under-65 people retired on disability (the boxes that fill line 11). */
export function disabledPeople(info: ScheduleRFilingInfo): Person[] {
  const people: Person[] =
    info.filingStatus === "married_filing_jointly" ? ["taxpayer", "spouse"] : ["taxpayer"];
  return people.filter((person) => statusOf(info, person) === "disabled");
}
