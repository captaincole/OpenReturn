/*
 * A made-up taxpayer (README.md): every name, number and address is invented.
 * No input documents: the facts are the boxes as the documents would print
 * them, and the answers the taxpayer states. The American Samoa income is one
 * answer fact (Form 4563); it is never a W-2 or 1099 fact.
 */

import {
  STUDENT_LOAN_KEYS,
  makeAmericanSamoaExclusionFactKey,
  makeDependentFactKey,
  makeDividendFactKey,
  makeInterestFactKey,
  makeRetirementDistributionFactKey,
  makeSocialSecurityFactKey,
  makeStudentLoanInterestFactKey,
  type AmericanSamoaExclusionFactValue,
  type DependentFactValue,
  type DividendFactValue,
  type InterestFactValue,
  type RetirementDistributionFactValue,
  type SocialSecurityFactValue,
  type StudentLoanInterestFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const BERYLLA_USER_ID = "berylla-synthetic";
export const BERYLLA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const MADE_UP = "made up";

export const BERYLLA = {
  firstName: "Berylla",
  lastName: "Saulevai",
  ssn: "400-00-4563",
  street: "18 Fagatogo Road",
  city: "Pago Pago",
  state: "AS",
  zip: "96799",
};

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: BERYLLA_USER_ID,
  taxYear: BERYLLA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: BERYLLA_USER_ID, taxYear: BERYLLA_TAX_YEAR, suffix, value });

/*
 * Form 4563: a bona fide resident of American Samoa since 2016. Every line of
 * Part II has income; lines 10 and 13 together stay under $400 of net
 * earnings, so no self-employment tax is owed.
 */
export const americanSamoaIncome: AmericanSamoaExclusionFactValue = {
  bonaFideResidentAllYear: true,
  usCitizenOrResident: true,
  residenceBegan: "08/01/2016",
  livingQuarters: ["purchased_home"],
  familyInAmericanSamoa: "Grandson Tavita Saulevai, all of 2025",
  employer: "Tutuila Port Services Co\n1 Harbor Road, Fagatogo, AS 96799",
  absences: [
    { left: "03/10/2025", returned: "03/24/2025", reason: "Medical visit in Honolulu" },
    { left: "07/02/2025", returned: "07/16/2025", reason: "Family visit in Hilo, Hawaii" },
    { left: "11/20/2025", returned: "11/30/2025", reason: "Vacation in Apia, Samoa" },
  ],
  wages: { amount: 48000, medicareWages: 48000 },
  interest: 300,
  dividends: 400,
  business: { amount: 250, grossIncome: 1600 },
  capitalGain: { amount: 4000, grossIncome: 4000 },
  rentalAndRoyalties: { amount: 3600, grossIncome: 6000 },
  farm: { amount: 100, grossIncome: 1800 },
  otherIncome: [
    { description: "Fautasi race prize", amount: 350 },
    { description: "Jury duty pay", amount: 150 },
  ],
};

const socialSecurity: SocialSecurityFactValue = {
  payerName: "Social Security Administration",
  box3: 18000,
  box5: 18000,
};

// A pension from her years in Hawaii (made up), a normal distribution.
const pension: RetirementDistributionFactValue = {
  payerName: "Kona Coast County Employees Retirement",
  planName: "Kona Coast County Pension Plan",
  owner: "taxpayer",
  box1: 22000,
  box2a: 22000,
  box4: 2200,
  box7: "7",
  box7IraSepSimple: false,
};

const interest: InterestFactValue = {
  payerName: "Leeward Federal Savings",
  payerTin: "00-0004563",
  box1: 1100,
};

const dividends: DividendFactValue = {
  payerName: "Mauna Growth Fund",
  payerTin: "00-0004564",
  box1a: 900,
  box1b: 600,
};

const studentLoan: StudentLoanInterestFactValue = {
  lenderName: "Pacific Island Student Lending",
  box1: 1800,
};

const grandson: DependentFactValue = {
  firstName: "Tavita",
  lastName: BERYLLA.lastName,
  ssn: "400-00-4565",
  relationship: "Grandson",
  dob: "05/09/2015",
  monthsLivedWithYou: 12,
  livedInUs: false,
  usCitizenOrResident: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
};

export const beryllaFacts: TaxFactRow[] = [
  idFact("name.first", BERYLLA.firstName),
  idFact("name.last", BERYLLA.lastName),
  idFact("ssn", BERYLLA.ssn),
  idFact("dob", "03/14/1958"),
  idFact("address.street", BERYLLA.street),
  idFact("address.city", BERYLLA.city),
  idFact("address.state", BERYLLA.state),
  idFact("address.zip", BERYLLA.zip),
  idFact("occupation", "Port records clerk"),
  idFact("phone", "684-555-0145"),
  fact(
    "foreign",
    makeAmericanSamoaExclusionFactKey("taxpayer"),
    americanSamoaIncome,
    `Verbal, with her Form W-2AS and her American Samoa bank, sale and rent records, ${MADE_UP}.`,
  ),
  fact("retirement", makeSocialSecurityFactKey("ssa"), socialSecurity, `SSA-1099, ${MADE_UP}.`),
  fact(
    "retirement",
    makeRetirementDistributionFactKey("kona-coast", "code-7"),
    pension,
    `1099-R from Kona Coast County Employees Retirement, ${MADE_UP}.`,
  ),
  fact(
    "investment_income",
    makeInterestFactKey("leeward-federal"),
    interest,
    `1099-INT from Leeward Federal Savings, ${MADE_UP}.`,
  ),
  fact(
    "investment_income",
    makeDividendFactKey("mauna-growth"),
    dividends,
    `1099-DIV from Mauna Growth Fund, ${MADE_UP}.`,
  ),
  fact(
    "education",
    makeStudentLoanInterestFactKey("pacific-island"),
    studentLoan,
    `1098-E from Pacific Island Student Lending, ${MADE_UP}.`,
  ),
  fact(
    "education",
    STUDENT_LOAN_KEYS.claimedAsDependent,
    false,
    "Verbal: no one claims Berylla as a dependent.",
  ),
  fact(
    "dependents",
    makeDependentFactKey("tavita-saulevai"),
    grandson,
    "Verbal: her grandson, with her in American Samoa all year.",
  ),
];
