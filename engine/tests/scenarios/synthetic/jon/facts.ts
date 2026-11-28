/*
 * A made-up single clinical researcher (README.md): every name and amount is
 * invented. The Schedule K-1 (Form 1065) is a made PDF in docs/
 * (generate-docs.ts). The clinical testing expenses, the orphan drug
 * designations and the Form 8932 credit come from the business's books and
 * the FDA's designation letters: no information return reports them, so they
 * are stated answers.
 */

import {
  ORPHAN_DRUG_CREDIT_KEY,
  makeBusinessFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeGeneralBusinessCreditFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  type BusinessFactValue,
  type DatedAmountFactValue,
  type GeneralBusinessCreditFactValue,
  type K1HoldingFactValue,
  type OrphanDrugCreditFactValue,
  type PartnershipK1FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const JON_USER_ID = "jon-synthetic";
export const JON_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";
const VERBAL = "Verbal, 2026-11-27";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: JON_USER_ID,
  taxYear: JON_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const JON = {
  taxpayer: { firstName: "Jon", lastName: "Tervale", ssn: "400-00-8820" },
  street: "1460 Lakemont Drive",
  city: "Bellevue",
  state: "WA",
  zip: "98006",
};

export const LAB_ID = "tervale-clinical-research";
export const LAB_KEY = makeBusinessFactKey(LAB_ID);

/* His clinical research practice (Schedule C): sponsored trials for rare disease drugs. */
export const lab: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Clinical research for rare disease drugs",
  code: "541714",
  name: "Tervale Clinical Research",
  address: { street: "2201 Northup Way", city: "Bellevue", state: "WA", zip: "98004" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  // The contract testing is paid to corporations, which need no Form 1099.
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 820000,
  expenses: {
    contractLabor: 88000,
    insurance: 14000,
    legalAndProfessional: 18000,
    rentOtherProperty: 60000,
    rentVehiclesMachinery: 9000,
    supplies: 46000,
    taxesAndLicenses: 17000,
    utilities: 8000,
    wages: 190000,
  },
  specifiedService: false,
  w2WagesPaid: 190000,
  qualifiedPropertyUbia: 0,
};

/*
 * The practice's orphan drug credit. Jon elects the reduced credit, so the
 * credit lowers no Schedule C expense. Two study coordinators are reservists whose
 * differential wage payments give a Form 8932 credit; $900 of it is on wages
 * also in line 1.
 */
export const orphanDrugCredit: OrphanDrugCreditFactValue = {
  businessKey: LAB_KEY,
  reducedCreditElection: true,
  expenses: {
    wages: 82400.6,
    supplies: 21350.25,
    computerRental: 4800,
    contractTesting: 61000,
  },
  drugs: [
    {
      name: "velmaprostat",
      designationApplicationNumber: "DRU-2021-8104",
      dateDesignated: "2021-09-14",
    },
    {
      name: "orvanexib",
      designationApplicationNumber: "DRU-2023-9417",
      dateDesignated: "2023-03-02",
    },
    {
      name: "talcimide",
      designationApplicationNumber: "DRU-2024-10288",
      dateDesignated: "2024-11-20",
    },
  ],
  differentialWageCreditOnSameWages: 900,
};

/*
 * Form 8932 line 2, the employer differential wage credit, which the engine
 * takes as stated. It lowers the practice's Schedule C wages (line 26).
 */
export const differentialWageCredit: GeneralBusinessCreditFactValue = {
  sourceForm: "8932",
  line: "1w",
  amount: 2400,
  passive: false,
  businessKey: LAB_KEY,
};

export const PARTNERSHIP_ID = "halvorn-rare-therapeutics";
export const PARTNERSHIP_EIN = "00-0008820";

/* A drug development partnership Jon works in: box 15 code Z is its orphan drug credit. */
export const partnershipK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Halvorn Rare Therapeutics LP",
  entityEin: PARTNERSHIP_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "general",
  profitPercent: 10,
  lossPercent: 10,
  capitalPercent: 10,
  boxes: [
    { box: "1", amount: 25000 },
    { box: "15", code: "Z", amount: 4250 },
  ],
};

const holding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 60000,
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 15000 }],
  ["2025-06", { date: "2025-06-16", amount: 15000 }],
  ["2025-09", { date: "2025-09-15", amount: 15000 }],
  ["2026-01", { date: "2026-01-15", amount: 15000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: JON_USER_ID, taxYear: JON_TAX_YEAR, suffix, value });

export const jonFacts: TaxFactRow[] = [
  idFact("name.first", JON.taxpayer.firstName),
  idFact("name.last", JON.taxpayer.lastName),
  idFact("ssn", JON.taxpayer.ssn),
  idFact("dob", "08/11/1976"),
  idFact("address.street", JON.street),
  idFact("address.city", JON.city),
  idFact("address.state", JON.state),
  idFact("address.zip", JON.zip),
  idFact("occupation", "Clinical researcher"),
  idFact("phone", "425-555-0182"),
  fact("self_employment", LAB_KEY, lab, `${VERBAL}: the practice's 2025 books.`),
  fact(
    "self_employment",
    ORPHAN_DRUG_CREDIT_KEY,
    orphanDrugCredit,
    `${VERBAL}: the practice's clinical testing ledger and the FDA orphan drug designation letters.`,
  ),
  fact(
    "other",
    makeGeneralBusinessCreditFactKey("form-8932"),
    differentialWageCredit,
    `${VERBAL}: the practice's Form 8932 worksheet.`,
  ),
  fact(
    "k1",
    makePartnershipK1FactKey(PARTNERSHIP_ID),
    partnershipK1,
    "Schedule K-1 (Form 1065) (docs/01-schedule-k1-halvorn-rare-therapeutics.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(PARTNERSHIP_ID), holding, VERBAL),
  ...PAYMENTS.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      value,
      `${VERBAL}: Form 1040-ES payment.`,
    ),
  ),
];
