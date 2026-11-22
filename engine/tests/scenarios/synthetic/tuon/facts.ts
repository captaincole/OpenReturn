/*
 * Tuon Halloran, a made-up single filer in Santa Rosa, California (README.md).
 * Every name, number and address is invented. No input documents: the facts
 * are the only source.
 */

import {
  CA_LUMP_SUM_OWN_KEY,
  makeInterestFactKey,
  makeRetirementDistributionFactKey,
  type CaLumpSumDistributionFactValue,
  type InterestFactValue,
  type RetirementDistributionFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const TUON_USER_ID = "tuon-synthetic";
export const TUON_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";
const HOME = { line1: "62 Laurel Bend Ct", city: "Santa Rosa", state: "CA", zip: "95404" };
const TAXPAYER = { firstName: "Tuon", lastName: "Halloran", ssn: "400-00-0451" };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TUON_USER_ID,
  taxYear: TUON_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TUON_USER_ID, taxYear: TUON_TAX_YEAR, suffix, value });

/*
 * The whole pension paid out in 2025: $52,000 taxable, $6,000 of it from
 * participation before 1974 (box 3), and an annuity contract worth $12,000
 * (box 8, not in boxes 1 and 2a).
 */
const PENSION_PAYER = "redwood-valley-pension";
const PENSION_ID = "r-1";
const pension: RetirementDistributionFactValue = {
  payerName: "Redwood Valley Mills Pension Plan",
  payerTin: "00-0000451",
  planName: "Redwood Valley Mills Retirement Plan",
  owner: "taxpayer",
  box1: 60000,
  box2a: 52000,
  box2b: { totalDistribution: true },
  box3: 6000,
  box4: 5200,
  box5: 8000,
  box7: "7",
  box7IraSepSimple: false,
  box8: 12000,
  box14: 1200,
  box15: "CA",
  box16: 52000,
};

/* Tuon's own plan: both California elections; federal Form 4972 is not used. */
const lumpSum: CaLumpSumDistributionFactValue = {
  distributions: [{ payerSlug: PENSION_PAYER, distributionId: PENSION_ID }],
  entireBalance: true,
  rolledOver: false,
  beneficiaryOfParticipantBornBefore1936: false,
  participantBornBefore1936FiveYears: true,
  usedScheduleG1After1986: false,
  capitalGainElection: true,
  tenYearAveraging: true,
};

const savings: InterestFactValue = { payerName: "Sonoma Coast Savings", box1: 8400 };

export const tuonFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "03/09/1934"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Sonoma"),
  idFact("occupation", "Retired"),
  idFact("phone", "707-555-0145"),
  fact(
    "retirement",
    makeRetirementDistributionFactKey(PENSION_PAYER, PENSION_ID),
    pension,
    "1099-R from the Redwood Valley Mills Pension Plan.",
  ),
  fact(
    "retirement",
    CA_LUMP_SUM_OWN_KEY,
    lumpSum,
    "Verbal: all of the plan paid out in 2025, none rolled over, in the plan since 1958, no earlier Schedule G-1; chooses the 5.5% election and 10-year averaging for California.",
  ),
  fact(
    "investment_income",
    makeInterestFactKey("sonoma-coast"),
    savings,
    "1099-INT, Sonoma Coast Savings.",
  ),
];
