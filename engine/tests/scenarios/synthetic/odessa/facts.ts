/*
 * A made-up couple (README.md): every name and amount is invented. One made
 * input document, the savings bond record (generate-docs.ts); the other facts
 * are the boxes as the documents would print them.
 */

import {
  SPOUSE_KEYS,
  makeInterestFactKey,
  makeSavingsBondCashedFactKey,
  makeSavingsBondExpenseFactKey,
  makeW2FactKey,
  type InterestFactValue,
  type SavingsBondCashedFactValue,
  type SavingsBondExpenseFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ODESSA_USER_ID = "odessa-integration";
export const ODESSA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-21T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ODESSA_USER_ID,
  taxYear: ODESSA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const ODESSA = {
  firstName: "Odessa",
  lastName: "Lindqvist",
  ssn: "400-00-8815",
  spouse: { firstName: "Rafael", lastName: "Lindqvist", ssn: "400-00-8816" },
  street: "418 Juniper Ridge Court",
  city: "Reno",
  state: "NV",
  zip: "89509",
};

const address = { line1: ODESSA.street, city: ODESSA.city, state: ODESSA.state, zip: ODESSA.zip };

const w2 = (
  owner: "taxpayer" | "spouse",
  person: { firstName: string; lastName: string; ssn: string },
  employerName: string,
  employerEin: string,
  wages: number,
  withheld: number,
  socialSecurityTax: number,
  medicareTax: number,
): W2FactValue => ({
  owner,
  employerName,
  employerEin,
  employerAddress: { line1: "1 Made Up Plaza", city: "Reno", state: "NV", zip: "89501" },
  employee: { ...person, address },
  box1: wages,
  box2: withheld,
  box3: wages,
  box4: socialSecurityTax,
  box5: wages,
  box6: medicareTax,
});

/* A credit union cashed the paper bonds: box 3 is their interest (5,420 + 3,620). */
const sierra: InterestFactValue = {
  payerName: "Sierra Federal Credit Union",
  box1: 412.37,
  box2: 45,
  box3: 9040,
};

/* TreasuryDirect cashed the electronic bonds: box 3 is their interest (1,310 + 3,280). */
const treasury: InterestFactValue = {
  payerName: "U.S. Treasury (TreasuryDirect)",
  box3: 4590,
};

/* Bond records (Form 8818 style); each bond is in Odessa's name, bought after she turned 24. */
const bonds: Array<[string, SavingsBondCashedFactValue, string]> = [
  [
    "paper-ee-2004",
    {
      serialNumber: "L000000123EE",
      series: "EE",
      format: "paper",
      issueDate: "2004-03-01",
      faceValue: 10000,
      proceeds: 10420,
      ownerQualifies: true,
    },
    "Savings bond record (docs/01-savings-bonds-cashed.pdf), row 1; the ownership test stated by Odessa.",
  ],
  [
    "electronic-ee-2012",
    {
      series: "EE",
      format: "electronic",
      issueDate: "2012-09-01",
      faceValue: 5000,
      proceeds: 6310,
      ownerQualifies: true,
    },
    "Savings bond record (docs/01-savings-bonds-cashed.pdf), row 2; the ownership test stated by Odessa.",
  ],
  [
    "series-i-2015",
    {
      series: "I",
      format: "electronic",
      issueDate: "2015-06-01",
      faceValue: 8000,
      proceeds: 11280,
      ownerQualifies: true,
    },
    "Savings bond record (docs/01-savings-bonds-cashed.pdf), row 3; the ownership test stated by Odessa.",
  ],
  [
    "paper-ee-1988",
    {
      serialNumber: "L000000045EE",
      series: "EE",
      format: "paper",
      issueDate: "1988-05-01",
      faceValue: 2000,
      proceeds: 4620,
      ownerQualifies: true,
    },
    "Savings bond record (docs/01-savings-bonds-cashed.pdf), row 4; the ownership test stated by Odessa.",
  ],
];

const expenses: Array<[string, SavingsBondExpenseFactValue, string]> = [
  [
    "odessa-unr",
    {
      studentName: "Odessa Lindqvist",
      institutionName: "University of Nevada, Reno",
      institutionAddress: "1664 N Virginia St, Reno, NV 89557",
      qualifiedExpenses: 12600,
      nontaxableBenefits: 3000,
    },
    "Bursar statement: graduate tuition and fees $12,600; a $3,000 tax-free grant paid to her.",
  ],
  [
    "rafael-tmcc",
    {
      studentName: "Rafael Lindqvist",
      institutionName: "Truckee Meadows Community College",
      institutionAddress: "7000 Dandini Blvd, Reno, NV 89512",
      qualifiedExpenses: 3400,
    },
    "Receipts: certificate program tuition $3,400.",
  ],
  [
    "rafael-qtp",
    {
      studentName: "Rafael Lindqvist",
      institutionName: "QTP: Silver Basin 529 Plan",
      institutionAddress: "PO Box 8815, Carson City, NV 89701",
      qualifiedExpenses: 2000,
    },
    "Plan statement: a $2,000 contribution for Rafael.",
  ],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ODESSA_USER_ID, taxYear: ODESSA_TAX_YEAR, suffix, value });

export const odessaFacts: TaxFactRow[] = [
  idFact("name.first", ODESSA.firstName),
  idFact("name.last", ODESSA.lastName),
  idFact("ssn", ODESSA.ssn),
  idFact("dob", "02/11/1974"),
  idFact("address.street", ODESSA.street),
  idFact("address.city", ODESSA.city),
  idFact("address.state", ODESSA.state),
  idFact("address.zip", ODESSA.zip),
  idFact("occupation", "Hydrologist"),
  idFact("phone", "775-555-0188"),
  fact("identity", SPOUSE_KEYS.firstName, ODESSA.spouse.firstName, "Stated by the taxpayer."),
  fact("identity", SPOUSE_KEYS.lastName, ODESSA.spouse.lastName, "Stated by the taxpayer."),
  fact("identity", SPOUSE_KEYS.ssn, ODESSA.spouse.ssn, "Stated by the taxpayer."),
  fact("identity", SPOUSE_KEYS.dob, "08/30/1972", "Stated by the taxpayer."),
  fact(
    "wages",
    makeW2FactKey("high-desert-water"),
    w2(
      "taxpayer",
      ODESSA,
      "High Desert Water Authority",
      "00-0008815",
      96500,
      12000,
      5983,
      1399.25,
    ),
    "W-2 from High Desert Water Authority.",
  ),
  fact(
    "wages",
    makeW2FactKey("comstock-tile"),
    w2("spouse", ODESSA.spouse, "Comstock Tile Works", "00-0008816", 58200, 5800, 3608.4, 843.9),
    "W-2 from Comstock Tile Works.",
  ),
  fact(
    "investment_income",
    makeInterestFactKey("sierra-fcu"),
    sierra,
    "1099-INT from Sierra Federal Credit Union, boxes 1–3.",
  ),
  fact(
    "investment_income",
    makeInterestFactKey("treasury-direct"),
    treasury,
    "1099-INT from TreasuryDirect, box 3.",
  ),
  ...bonds.map(([slug, value, note]) =>
    fact("education", makeSavingsBondCashedFactKey(slug), value, note),
  ),
  ...expenses.map(([slug, value, note]) =>
    fact("education", makeSavingsBondExpenseFactKey(slug), value, note),
  ),
];
