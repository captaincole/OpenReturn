/*
 * Who qualifies to file Form 2555 (irs-2555-inst-2025::sec::who-qualifies::b01):
 * "You meet the tax home test" and "either the bona fide residence test or the
 * physical presence test". The engine checks the time rules the form states;
 * the tax home and a bona fide residence are the taxpayer's answers.
 */

import type { ForeignEarnedIncomeFactValue } from "../../facts/index.js";
import {
  coversWholeYear,
  fullDaysAbroad,
  isTwelveMonthPeriod,
  PHYSICAL_PRESENCE_DAYS,
  qualifyingDays,
} from "./dates.js";

export type Qualification =
  | { qualifies: true; test: "bona_fide_residence" | "physical_presence" }
  | { qualifies: false; why: string }
  /* An answer is missing or is not a date: the form waits for it. */
  | { waiting: string };

const BOTH_TESTS =
  "The answers name both tests: complete either Part II or Part III of Form 2555, but not both (irs-2555-inst-2025::sec::line-9::b01).";

function bonaFide(value: ForeignEarnedIncomeFactValue): Qualification {
  const residence = value.bonaFideResidence;
  if (residence === undefined) return { waiting: "the bona fide residence answers" };
  // "If you answered 'Yes' to 13a and 'No' to 13b, you don't qualify as a bona fide resident" (face-part-ii::b01).
  if (residence.nonresidentStatement && !residence.foreignIncomeTaxRequired) {
    return { qualifies: false, why: "line 13a Yes and line 13b No: not a bona fide resident" };
  }
  if (!coversWholeYear(residence.began, residence.ended)) {
    return { qualifies: false, why: "the bona fide residence does not include an entire tax year" };
  }
  return { qualifies: true, test: "bona_fide_residence" };
}

function physicalPresence(value: ForeignEarnedIncomeFactValue): Qualification {
  const presence = value.physicalPresence;
  if (presence === undefined) return { waiting: "the physical presence answers" };
  if (!isTwelveMonthPeriod(presence)) {
    return {
      qualifies: false,
      why: "line 16 is not a period of 12 months in a row with part of it in 2025",
    };
  }
  if (fullDaysAbroad(presence) < PHYSICAL_PRESENCE_DAYS) {
    return { qualifies: false, why: "fewer than 330 full days in a foreign country" };
  }
  return { qualifies: true, test: "physical_presence" };
}

export function qualification(value: ForeignEarnedIncomeFactValue): Qualification | string {
  if (value.bonaFideResidence && value.physicalPresence) return BOTH_TESTS;
  if (!value.bonaFideResidence && !value.physicalPresence) {
    return { waiting: "which test the taxpayer meets (Part II or Part III)" };
  }
  const days = qualifyingDays(value);
  if (days === undefined) return { waiting: "a date in MM/DD/YYYY form" };
  const result = value.bonaFideResidence ? bonaFide(value) : physicalPresence(value);
  if ("qualifies" in result && result.qualifies && days === 0) {
    return { qualifies: false, why: "no day of the qualifying period falls in 2025" };
  }
  return result;
}
