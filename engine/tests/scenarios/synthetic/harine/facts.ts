/*
 * A made-up partner (README.md): every name and amount is invented. The
 * Form 8986 is a made document (generate-docs.ts renders it from the object
 * below); the W-2 and the 1099-R have no PDF. The year facts are her answers:
 * the totals of each earlier return and the corrected tax from her
 * preparer's statements.
 */

import {
  makeForm8986FactKey,
  makePartnerAdjustmentYearFactKey,
  makeRetirementDistributionFactKey,
  makeW2FactKey,
  type Form8986FactValue,
  type PartnerAdjustmentYearFactValue,
  type RetirementDistributionFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const HARINE_USER_ID = "harine-integration";
export const HARINE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: HARINE_USER_ID,
  taxYear: HARINE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const HARINE = {
  firstName: "Harine",
  lastName: "Tolvarro",
  ssn: "400-00-8979",
  street: "3318 W Riverbend Avenue",
  city: "Spokane",
  state: "WA",
  zip: "99201",
};

const address = { line1: HARINE.street, city: HARINE.city, state: HARINE.state, zip: HARINE.zip };

// W-2 from Inland Empire Cooperative (made up).
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Inland Empire Cooperative",
  employerEin: "00-0008979",
  employerAddress: { line1: "1450 N Division Street", city: "Spokane", state: "WA", zip: "99207" },
  employee: { firstName: HARINE.firstName, lastName: HARINE.lastName, ssn: HARINE.ssn, address },
  box1: 24000,
  box2: 1400,
  box3: 24000,
  box4: 1488,
  box5: 24000,
  box6: 348,
};

/* Harine, 38, took $5,000 out of her old 401(k): code 1, no exception. Schedule 2 line 8 takes 10%. */
const early401k: RetirementDistributionFactValue = {
  owner: "taxpayer",
  payerName: "Cascade Plan Services",
  payerTin: "00-0008980",
  planName: "Palouse Grain 401(k) Plan",
  box1: 5000,
  box2a: 5000,
  box4: 1000,
  box7: "1",
  box7IraSepSimple: false,
};

/*
 * Form 8986 from Fernhollow Orchards LLC, which filed an administrative
 * adjustment request for 2022 (Part I box 3): it had overstated ordinary
 * income. An AAR shows no modifications.
 */
export const fernhollow: Form8986FactValue = {
  trackingNumber: "FO-AAR-2022-0093",
  submitter: "aar_partnership",
  returnType: "1065",
  partnershipName: "Fernhollow Orchards LLC",
  partnershipAddress: "6120 Orchard Bluff Road, Wenatchee, WA 98801",
  partnershipTin: "00-0008981",
  reviewYearEnded: "2022-12-31",
  adjustmentYearEnded: "2025-12-31",
  extendedDueDate: "2026-09-15",
  dateFurnished: "2025-03-28",
  partnerShare: {
    profit: { asReported: 12, change: 0, corrected: 12 },
    loss: { asReported: 12, change: 0, corrected: 12 },
    capital: { asReported: 12, change: 0, corrected: 12 },
  },
  adjustments: [
    {
      lineNumber: "1",
      lineTitle: "Ordinary business income (loss)",
      asReported: 31000,
      netAdjustment: -40000,
      asCorrected: -9000,
    },
  ],
};

/*
 * 2022, the AAR's first affected year: $40,000 less ordinary income turns
 * the business income into a $9,000 loss, so the $6,200 qualified business
 * income deduction she took is gone.
 */
const year2022: PartnerAdjustmentYearFactValue = {
  taxYear: 2022,
  totalIncome: 58000,
  totalDeductions: 19150,
  totalCredits: 0,
  totalIncomeTax: 4457,
  attributeAdjustments: [
    {
      source: "aar",
      line: "deductions",
      description: "Qualified business income deduction (Form 8995) no longer allowed",
      amount: -6200,
    },
  ],
  aar: { incomeTax: 505 },
};

/*
 * 2023, an intervening year: the $9,000 qualified business loss carries to
 * 2023 and lowers that year's deduction by 20% of it.
 */
const year2023: PartnerAdjustmentYearFactValue = {
  taxYear: 2023,
  totalIncome: 44000,
  totalDeductions: 18850,
  totalCredits: 0,
  totalIncomeTax: 2798,
  attributeAdjustments: [
    {
      source: "aar",
      line: "deductions",
      description: "Qualified business loss carryforward from 2022 (Form 8995)",
      amount: -1800,
    },
  ],
  aar: { incomeTax: 3014 },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: HARINE_USER_ID, taxYear: HARINE_TAX_YEAR, suffix, value });

const yearFact = (value: PartnerAdjustmentYearFactValue) =>
  fact(
    "k1",
    makePartnerAdjustmentYearFactKey(value.taxYear),
    value,
    `Stated by Harine: her ${value.taxYear} return as filed, and her preparer's statement of the corrected tax.`,
  );

export const harineFacts: TaxFactRow[] = [
  idFact("name.first", HARINE.firstName),
  idFact("name.last", HARINE.lastName),
  idFact("ssn", HARINE.ssn),
  idFact("dob", "02/14/1987"),
  idFact("address.street", HARINE.street),
  idFact("address.city", HARINE.city),
  idFact("address.state", HARINE.state),
  idFact("address.zip", HARINE.zip),
  idFact("occupation", "Grain elevator operator"),
  idFact("phone", "509-555-0142"),
  fact("wages", makeW2FactKey("inland-empire-coop"), w2, "W-2 from Inland Empire Cooperative."),
  fact(
    "retirement",
    makeRetirementDistributionFactKey("cascade-plan-services", "code-1"),
    early401k,
    "1099-R from Cascade Plan Services, an early distribution (code 1).",
  ),
  fact(
    "k1",
    makeForm8986FactKey("fernhollow-orchards-2022"),
    fernhollow,
    "Form 8986 from Fernhollow Orchards LLC (docs/01-form-8986-fernhollow-orchards.pdf).",
  ),
  yearFact(year2022),
  yearFact(year2023),
];
