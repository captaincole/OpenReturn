import type { ScheduleRFilingInfo } from "./filingInfo.js";

/* Part I: the one box that applies (specific-instructions::b01: "Only check one box"). */
export type PartIBox = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

type Person = "taxpayer" | "spouse";

/* "65": 65 or older. "disabled": under 65, retired on disability, with taxable disability income. */
type PersonStatus = "65" | "disabled" | "not";

/*
 * A qualified individual (irs-1040sr-inst-2025::sec::qualified-individual::b01).
 * The retired answer is asked only of a person under 65 with disability
 * income (resolveInfo.ts). Undefined while an answer is missing.
 */
function personStatus(info: ScheduleRFilingInfo, person: Person): PersonStatus | undefined {
  const taxpayer = person === "taxpayer";
  const over65 = taxpayer ? info.taxpayerBornBeforeJan2_1961 : info.spouseBornBeforeJan2_1961;
  if (over65 === true) return "65";
  const income = taxpayer
    ? info.scheduleRTaxpayerDisabilityIncome
    : info.scheduleRSpouseDisabilityIncome;
  if (over65 === undefined || income === undefined) return undefined;
  if (income <= 0) return "not";
  const retired = taxpayer
    ? info.scheduleRTaxpayerRetiredOnDisability
    : info.scheduleRSpouseRetiredOnDisability;
  if (retired === undefined) return undefined;
  return retired ? "disabled" : "not";
}

function jointBox(taxpayer: PersonStatus, spouse: PersonStatus): PartIBox | null {
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
  const taxpayer = personStatus(info, "taxpayer");
  if (status === "married_filing_jointly") {
    const spouse = personStatus(info, "spouse");
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
  return people.filter((person) => personStatus(info, person) === "disabled");
}
