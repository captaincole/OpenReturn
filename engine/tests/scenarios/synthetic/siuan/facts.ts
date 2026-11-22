/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the facts are the boxes as the two Forms 1099-R would print them.
 */

import {
  makeLumpSumDistributionFactKey,
  makeRetirementDistributionFactKey,
  type LumpSumDistributionFactValue,
  type RetirementDistributionFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const SIUAN_USER_ID = "siuan-integration";
export const SIUAN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: SIUAN_USER_ID,
  taxYear: SIUAN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const SIUAN = {
  firstName: "Siuan",
  lastName: "Ferrandel",
  ssn: "400-00-4972",
  street: "618 Juniper Ridge Road",
  city: "Reno",
  state: "NV",
  zip: "89509",
};

/* Her own pension from a former employer: monthly payments, fully taxable (code 7). */
const pension: RetirementDistributionFactValue = {
  payerName: "Truckee Valley Water District Pension Plan",
  payerTin: "00-0004971",
  box1: 24_000,
  box2a: 24_000,
  box4: 2_400,
  box7: "7",
  box7IraSepSimple: false,
};

/*
 * The lump sum she received as her father's beneficiary: his entire balance in
 * a profit-sharing plan, cash, employer stock (with net unrealized
 * appreciation in box 6) and an annuity contract (box 8). Code 4 (death) and
 * A (may be eligible for the 10-year tax option). Box 1 is box 2a plus the NUA.
 */
const lumpSum: RetirementDistributionFactValue = {
  payerName: "Harlow Tool Works Profit-Sharing Plan",
  payerTin: "00-0004972",
  planName: "Harlow Tool Works Profit-Sharing Plan",
  box1: 52_000,
  box2a: 46_000,
  box2b: { totalDistribution: true },
  box3: 5_520,
  box4: 9_200,
  box6: 6_000,
  box7: "4A",
  box7IraSepSimple: false,
  box8: 9_000,
};

export const LUMP_SUM_KEY = makeRetirementDistributionFactKey("harlow-tool-works", "lump-sum");

/*
 * Her answers: her father (born 1929) died in 1995, before August 21, 1996.
 * She has never used Form 4972. She makes both elections and includes the NUA.
 * The estate's administrator gave the death benefit exclusion and the federal
 * estate tax on the distribution.
 */
const fatherLumpSum: LumpSumDistributionFactValue = {
  distributionKeys: [LUMP_SUM_KEY],
  receivedAs: "beneficiary",
  entireBalance: true,
  rolledOverAnyPart: false,
  participantBornBefore1936: true,
  priorElectionOwnPlan: false,
  priorElectionAsBeneficiary: false,
  capitalGainElection: true,
  tenYearOption: true,
  includeNua: true,
  deathBenefitExclusion: 5_000,
  federalEstateTax: 3_000,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: SIUAN_USER_ID, taxYear: SIUAN_TAX_YEAR, suffix, value });

export const siuanFacts: TaxFactRow[] = [
  idFact("name.first", SIUAN.firstName),
  idFact("name.last", SIUAN.lastName),
  idFact("ssn", SIUAN.ssn),
  idFact("dob", "06/03/1958"),
  idFact("address.street", SIUAN.street),
  idFact("address.city", SIUAN.city),
  idFact("address.state", SIUAN.state),
  idFact("address.zip", SIUAN.zip),
  idFact("occupation", "Retired"),
  idFact("phone", "775-555-0149"),
  fact(
    "retirement",
    makeRetirementDistributionFactKey("truckee-valley-water", "pension"),
    pension,
    "1099-R from Truckee Valley Water District Pension Plan.",
  ),
  fact(
    "retirement",
    LUMP_SUM_KEY,
    lumpSum,
    "1099-R from Harlow Tool Works Profit-Sharing Plan, total distribution.",
  ),
  fact(
    "retirement",
    makeLumpSumDistributionFactKey("father"),
    fatherLumpSum,
    "Verbal, 2026-11-22: beneficiary of her father (born 1929, died 1995); the estate administrator's letter gives the exclusion and the estate tax.",
  ),
];
