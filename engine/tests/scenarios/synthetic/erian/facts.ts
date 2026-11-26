/*
 * A made-up married couple (README.md): every name and amount is invented. No
 * input documents: the facts are the boxes as the documents would print them,
 * and the answers the couple states.
 */

import {
  EDUCATOR_EXPENSE_KEYS,
  INJURED_SPOUSE_CATEGORY,
  INJURED_SPOUSE_KEY,
  SPOUSE_KEYS,
  makeDependentFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeInterestFactKey,
  makeRetirementDistributionFactKey,
  makeW2FactKey,
  type DependentFactValue,
  type InjuredSpouseFactValue,
  type InterestFactValue,
  type RetirementDistributionFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ERIAN_USER_ID = "erian-integration";
export const ERIAN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const MADE_UP = "synthetic (made up for this scenario)";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ERIAN_USER_ID,
  taxYear: ERIAN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const ERIAN = { firstName: "Erian", lastName: "Thalmont", ssn: "400-00-8379" };
export const BASTIEN = { firstName: "Bastien", lastName: "Thalmont", ssn: "400-00-8380" };
const HOME = { line1: "1184 Saw Palmetto Way", city: "Gainesville", state: "FL", zip: "32608" };

// Erian's W-2 from Alachua Hollow Elementary (made up): she teaches third grade.
const erianW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Alachua Hollow School District",
  employerEin: "00-0008379",
  employerAddress: { line1: "620 Archer Road", city: "Gainesville", state: "FL", zip: "32601" },
  employee: { ...ERIAN, address: HOME },
  box1: 46000,
  box2: 2600,
  box3: 46000,
  box4: 2852,
  box5: 46000,
  box6: 667,
};

// Bastien's W-2 from Santa Fe River Outfitters (made up).
const bastienW2: W2FactValue = {
  owner: "spouse",
  employerName: "Santa Fe River Outfitters LLC",
  employerEin: "00-0008380",
  employerAddress: { line1: "41 River Rise Road", city: "High Springs", state: "FL", zip: "32643" },
  employee: { ...BASTIEN, address: HOME },
  box1: 22000,
  box2: 700,
  box3: 22000,
  box4: 1364,
  box5: 22000,
  box6: 319,
};

/*
 * 1099-R from Suwannee Retirement Services (made up): Bastien, 39, cashed out an
 * old 401(k), code 1 (early distribution, no known exception). The 10%
 * additional tax goes on Schedule 2 line 8.
 */
const bastienDistribution: RetirementDistributionFactValue = {
  payerName: "Suwannee Retirement Services",
  planName: "Santa Fe River Outfitters 401(k) Plan",
  owner: "spouse",
  box1: 4000,
  box2a: 4000,
  box4: 400,
  box7: "1",
  box7IraSepSimple: false,
};

// 1099-INT from Paynes Prairie Credit Union (made up): a joint savings account.
const jointInterest: InterestFactValue = {
  payerName: "Paynes Prairie Credit Union",
  payerTin: "00-0008381",
  box1: 300,
};

const child = (firstName: string, ssn: string, dob: string): DependentFactValue => ({
  firstName,
  lastName: "Thalmont",
  ssn,
  relationship: firstName === "Liora" ? "Daughter" : "Son",
  dob,
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
});

/*
 * Form 8379: the joint refund will go to Bastien's past-due child support from
 * an earlier marriage, which Erian does not owe. Each spouse would claim one
 * child on a separate return, so each takes half of the child tax credits. The
 * joint interest is split in half. They agree to split the joint estimated tax
 * payments in half. Erian wants her refund mailed to her sister's address.
 */
export const erianClaim: InjuredSpouseFactValue = {
  injuredSpouse: "taxpayer",
  offsetForOtherSpouseDebt: true,
  legallyObligated: false,
  communityPropertyStates: [],
  refundInBothNames: false,
  refundMailingAddress: "2207 Pelican Cove Lane, Sarasota, FL 34231",
  shares: {
    otherIncome: 150,
    adjustments: 300,
    nonrefundableCredits: 2193,
    refundableCredits: 7,
    otherTaxes: 0,
    otherWithholding: 0,
    payments: 500,
  },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ERIAN_USER_ID, taxYear: ERIAN_TAX_YEAR, suffix, value });

const IDENTITY: TaxFactRow[] = [
  idFact("name.first", ERIAN.firstName),
  idFact("name.last", ERIAN.lastName),
  idFact("ssn", ERIAN.ssn),
  idFact("dob", "04/17/1988"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("occupation", "Teacher"),
  idFact("phone", "352-555-0179"),
  fact("identity", SPOUSE_KEYS.firstName, BASTIEN.firstName, MADE_UP),
  fact("identity", SPOUSE_KEYS.lastName, BASTIEN.lastName, MADE_UP),
  fact("identity", SPOUSE_KEYS.occupation, "Outfitter guide", MADE_UP),
  fact("identity", SPOUSE_KEYS.ssn, BASTIEN.ssn, MADE_UP),
  fact("identity", SPOUSE_KEYS.dob, "09/02/1986", MADE_UP),
];

const INCOME: TaxFactRow[] = [
  fact("wages", makeW2FactKey("alachua-hollow"), erianW2, `Erian's W-2, ${MADE_UP}.`),
  fact("wages", makeW2FactKey("santa-fe-river"), bastienW2, `Bastien's W-2, ${MADE_UP}.`),
  fact(
    "retirement",
    makeRetirementDistributionFactKey("suwannee-retirement", "code-1"),
    bastienDistribution,
    `Bastien's 1099-R, ${MADE_UP}.`,
  ),
  fact(
    "investment_income",
    makeInterestFactKey("paynes-prairie"),
    jointInterest,
    `1099-INT for the joint account, ${MADE_UP}.`,
  ),
  fact(
    "other",
    EDUCATOR_EXPENSE_KEYS.taxpayer,
    300,
    `Stated by Erian: classroom supplies, ${MADE_UP}.`,
  ),
];

const PAYMENTS: TaxFactRow[] = [
  fact(
    "estimated_payments",
    makeEstimatedTaxPaymentFactKey("2025-06-16"),
    { date: "2025-06-16", amount: 500 },
    `Stated by the couple: a joint estimated payment, ${MADE_UP}.`,
  ),
  fact(
    "estimated_payments",
    makeEstimatedTaxPaymentFactKey("2025-09-15"),
    { date: "2025-09-15", amount: 500 },
    `Stated by the couple: a joint estimated payment, ${MADE_UP}.`,
  ),
];

const CHILDREN: TaxFactRow[] = [
  fact(
    "dependents",
    makeDependentFactKey("liora-thalmont"),
    child("Liora", "400-00-8382", "05/09/2014"),
    MADE_UP,
  ),
  fact(
    "dependents",
    makeDependentFactKey("cassian-thalmont"),
    child("Cassian", "400-00-8383", "12/01/2018"),
    MADE_UP,
  ),
];

export const erianFacts: TaxFactRow[] = [
  ...IDENTITY,
  ...INCOME,
  ...PAYMENTS,
  ...CHILDREN,
  fact(
    INJURED_SPOUSE_CATEGORY,
    INJURED_SPOUSE_KEY,
    erianClaim,
    `Stated by Erian: the IRS notice of offset for Bastien's child support, and their split of the joint items, ${MADE_UP}.`,
  ),
];
