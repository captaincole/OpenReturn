/*
 * Riley Quinn, a made-up single filer in Reno, Nevada (README.md). Every name,
 * number and amount here is invented; no document or return stands behind it.
 */

import {
  makeEarlyDistributionExceptionKey,
  makeRetirementDistributionFactKey,
  makeW2FactKey,
  type EarlyDistributionExceptionFactValue,
  type RetirementDistributionFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const RILEY_USER_ID = "riley-integration";
export const RILEY_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-21T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: RILEY_USER_ID,
  taxYear: RILEY_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

/* The taxpayer as the made-up documents print them. */
const RILEY = {
  firstName: "Riley",
  lastName: "Quinn",
  ssn: "900-55-0123",
  street: "418 Juniper Hill Rd",
  city: "Reno",
  state: "NV",
  zip: "89509",
};
const address = { line1: RILEY.street, city: RILEY.city, state: RILEY.state, zip: RILEY.zip };

/* The W-2 from the current employer. Nevada has no income tax: boxes 15–17 are blank. */
const sagebrushW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Sagebrush Instruments LLC",
  employerEin: "00-0005329",
  employerAddress: { line1: "75 Truckee Way", city: "Reno", state: "NV", zip: "89501" },
  employee: { firstName: RILEY.firstName, lastName: RILEY.lastName, ssn: RILEY.ssn, address },
  box1: 68000,
  box2: 9800,
  box3: 68000,
  box4: 4216,
  box5: 68000,
  box6: 986,
  box13: { retirementPlan: true },
};

/* 1099-R from the former employer's 401(k): an early distribution after Riley left, 20% withheld. */
export const TALLOW_PAYER = "tallow-pine-401k";
export const TALLOW_DISTRIBUTION_ID = "r-1";
const tallowDistribution: RetirementDistributionFactValue = {
  payerName: "Tallow & Pine 401(k) Plan",
  payerTin: "00-0005330",
  planName: "Tallow & Pine Savings Plan",
  owner: "taxpayer",
  box1: 12000,
  box2a: 12000,
  box4: 2400,
  box7: "1",
  box7IraSepSimple: false,
};

/* 1099-R from the current employer's 401(k): a hardship withdrawal for medical bills, 10% withheld. */
export const SAGEBRUSH_PAYER = "sagebrush-401k";
export const SAGEBRUSH_DISTRIBUTION_ID = "r-1";
const sagebrushDistribution: RetirementDistributionFactValue = {
  payerName: "Sagebrush Instruments 401(k) Plan",
  payerTin: "00-0005331",
  owner: "taxpayer",
  box1: 8000,
  box2a: 8000,
  box4: 800,
  box7: "1",
  box7IraSepSimple: false,
};

/* Exception 23: one emergency personal expense distribution, $1,000 of the $12,000. */
const emergencyException: EarlyDistributionExceptionFactValue = { number: "23", amount: 1000 };

/*
 * Exception 05: unreimbursed medical expenses paid in 2025 ($9,500) less 7.5% of
 * AGI ($88,000 x 7.5% = $6,600) is $2,900, so $2,900 of the $8,000 is excluded.
 */
const medicalException: EarlyDistributionExceptionFactValue = { number: "05", amount: 2900 };

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: RILEY_USER_ID, taxYear: RILEY_TAX_YEAR, suffix, value });

export const rileyFacts: TaxFactRow[] = [
  idFact("name.first", RILEY.firstName),
  idFact("name.last", RILEY.lastName),
  idFact("ssn", RILEY.ssn),
  idFact("dob", "06/14/1985"),
  idFact("address.street", RILEY.street),
  idFact("address.city", RILEY.city),
  idFact("address.state", RILEY.state),
  idFact("address.zip", RILEY.zip),
  idFact("occupation", "Lab technician"),
  idFact("phone", "775-555-0147"),
  fact("wages", makeW2FactKey("sagebrush"), sagebrushW2, "W-2 from Sagebrush Instruments LLC."),
  fact(
    "retirement",
    makeRetirementDistributionFactKey(TALLOW_PAYER, TALLOW_DISTRIBUTION_ID),
    tallowDistribution,
    "1099-R from the Tallow & Pine 401(k) Plan.",
  ),
  fact(
    "retirement",
    makeRetirementDistributionFactKey(SAGEBRUSH_PAYER, SAGEBRUSH_DISTRIBUTION_ID),
    sagebrushDistribution,
    "1099-R from the Sagebrush Instruments 401(k) Plan.",
  ),
  fact(
    "retirement",
    makeEarlyDistributionExceptionKey(TALLOW_PAYER, TALLOW_DISTRIBUTION_ID),
    emergencyException,
    "Verbal: $1,000 of the Tallow & Pine distribution paid an emergency car repair (exception 23).",
  ),
  fact(
    "retirement",
    makeEarlyDistributionExceptionKey(SAGEBRUSH_PAYER, SAGEBRUSH_DISTRIBUTION_ID),
    medicalException,
    "Verbal: $9,500 of unreimbursed medical bills paid in 2025; over 7.5% of AGI that is $2,900 (exception 05).",
  ),
];
