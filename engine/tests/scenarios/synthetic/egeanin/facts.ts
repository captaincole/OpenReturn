/*
 * A made-up taxpayer (README.md): every name and amount is invented. The
 * documents have no PDFs: their facts are the boxes as they would print them.
 * The rest are her answers.
 */

import {
  BUSINESS_LOSS_LIMIT_KEYS,
  CA_BUSINESS_LOSS_LIMIT_KEYS,
  CA_EITC_KEYS,
  CA_EMPLOYEE_CLASSIFICATION_KEYS,
  EIC_KEYS,
  OTHER_INCOME_KEYS,
  RENTAL_KEYS,
  makeBusinessFactKey,
  makeDividendFactKey,
  makeK1HoldingFactKey,
  makeRentalFactKey,
  makeSCorporationK1FactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type DividendFactValue,
  type K1HoldingFactValue,
  type RentalFactValue,
  type SCorporationK1FactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const EGEANIN_USER_ID = "egeanin-synthetic";
export const EGEANIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-24T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: EGEANIN_USER_ID,
  taxYear: EGEANIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const EGEANIN = {
  taxpayer: { firstName: "Egeanin", lastName: "Sarvane", ssn: "400-00-3461" },
  street: "3461 Seawatch Lane",
  city: "Long Beach",
  state: "CA",
  zip: "90803",
};

const address = {
  line1: EGEANIN.street,
  city: EGEANIN.city,
  state: EGEANIN.state,
  zip: EGEANIN.zip,
};
const street = {
  street: EGEANIN.street,
  city: EGEANIN.city,
  state: EGEANIN.state,
  zip: EGEANIN.zip,
};

/* Her W-2 from the shipping line she manages. */
const w2: W2FactValue = {
  employerName: "Tarabon Coast Shipping, Inc.",
  employerEin: "00-0034611",
  employerAddress: { line1: "100 Harbor Plaza", city: "Long Beach", state: "CA", zip: "90802" },
  employee: { ...EGEANIN.taxpayer, address },
  box1: 380000,
  box2: 80000,
  box3: 176100,
  box4: 10918.2,
  box5: 380000,
  box6: 7130,
  box15: "CA",
  box16: 380000,
  box17: 32000,
};

/* Her consulting business (Schedule C), with a profit. */
const consulting: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Marine logistics consulting",
  code: "541600",
  name: "Sarvane Marine Consulting",
  address: street,
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 60000,
  expenses: { travel: 7000, legalAndProfessional: 5000, supplies: 6000 },
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

/* A bank stock fund: ordinary dividends only. */
const fundDividends: DividendFactValue = {
  payerName: "Falme Bay Income Fund",
  payerTin: "00-0034612",
  box1a: 2400,
  box1b: 2000,
};

/*
 * The K-1 of the shipyard she owns and runs (an S corporation): a large
 * ordinary loss from a new dry dock, and a long-term capital loss on stock
 * the shipyard held. No section 199A statement came with it.
 */
const SHIPYARD_ID = "seanchan-dry-dock";
const shipyardK1: SCorporationK1FactValue = {
  form: "1120-S",
  entityName: "Seanchan Dry Dock, Inc.",
  entityEin: "00-0034613",
  finalK1: false,
  amendedK1: false,
  allocationPercent: 100,
  sharesAtStart: 1000,
  sharesAtEnd: 1000,
  boxes: [
    { box: "1", amount: -650000 },
    { box: "8a", amount: -5000 },
  ],
};

/* She works in the shipyard full time; all of her money in it is at risk. */
const shipyardHolding: K1HoldingFactValue = {
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  stockBasisAtStart: 900000,
  stockAcquiredAs: "original_shareholder",
};

/* A house she rents out through a manager: an investment, not a trade or business. */
const rentalHouse: RentalFactValue = {
  propertyType: "single_family",
  address: { street: "12 Tanchico Street", city: "Long Beach", state: "CA", zip: "90804" },
  fairRentalDays: 365,
  personalUseDays: 0,
  rentsReceived: 24000,
  expenses: {
    insurance: 1500,
    managementFees: 2400,
    repairs: 2500,
    taxes: 3000,
    depreciationOrDepletion: 2600,
  },
  activeParticipation: true,
  materiallyParticipated: false,
  allInvestmentAtRisk: true,
  priorYearUnallowedLoss: 0,
  disposedOfEntirely: false,
  qualifiedBusiness: false,
  tradeOrBusiness: false,
  specifiedService: false,
};

/* Royalties from a sea chart book her grandfather drew: portfolio income, with a loss this year. */
const chartRoyalty: RentalFactValue = {
  propertyType: "royalties",
  royaltiesReceived: 2000,
  expenses: { legalAndProfessional: 3500 },
  royaltyActivity: "portfolio",
  allInvestmentAtRisk: true,
  priorYearUnallowedLoss: 0,
  qualifiedBusiness: false,
  specifiedService: false,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: EGEANIN_USER_ID, taxYear: EGEANIN_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-24";

export const egeaninFacts: TaxFactRow[] = [
  idFact("name.first", EGEANIN.taxpayer.firstName),
  idFact("name.last", EGEANIN.taxpayer.lastName),
  idFact("ssn", EGEANIN.taxpayer.ssn),
  idFact("dob", "03/14/1974"),
  idFact("address.street", EGEANIN.street),
  idFact("address.city", EGEANIN.city),
  idFact("address.state", EGEANIN.state),
  idFact("address.zip", EGEANIN.zip),
  idFact("address.county", "Los Angeles"),
  idFact("occupation", "Shipping manager"),
  idFact("phone", "562-555-3461"),
  fact("wages", makeW2FactKey("tarabon-coast"), w2, "W-2 from Tarabon Coast Shipping, Inc."),
  fact(
    "self_employment",
    makeBusinessFactKey("sarvane-marine-consulting"),
    consulting,
    `${VERBAL}: receipts and expenses from her ledger.`,
  ),
  fact(
    "investment_income",
    makeDividendFactKey("falme-bay"),
    fundDividends,
    "1099-DIV from Falme Bay Income Fund.",
  ),
  fact(
    "k1",
    makeSCorporationK1FactKey(SHIPYARD_ID),
    shipyardK1,
    "Schedule K-1 (Form 1120-S) from Seanchan Dry Dock, Inc.",
  ),
  fact(
    "k1",
    makeK1HoldingFactKey(SHIPYARD_ID),
    shipyardHolding,
    `${VERBAL}: stock basis from her 2024 Form 7203 line 15.`,
  ),
  fact(
    "rental",
    makeRentalFactKey("tanchico-street"),
    rentalHouse,
    `${VERBAL}: manager's statement.`,
  ),
  fact(
    "rental",
    makeRentalFactKey("chart-royalty"),
    chartRoyalty,
    `${VERBAL}: publisher's statement.`,
  ),
  fact("rental", RENTAL_KEYS.realEstateProfessional, false, VERBAL),
  fact("rental", RENTAL_KEYS.paymentsRequire1099, false, VERBAL),
  fact(
    "other",
    OTHER_INCOME_KEYS.otherItems,
    [{ description: "Recovery of a business bad debt (closed chandlery)", amount: 6000 }],
    `${VERBAL}: a customer of her closed chandlery paid a debt she deducted in 2022.`,
  ),
  fact(
    "other",
    BUSINESS_LOSS_LIMIT_KEYS.otherBusinessIncome,
    6000,
    `${VERBAL}: the recovery on Schedule 1 line 8z comes from her former business (Form 461 and FTB 3461 line 8).`,
  ),
  fact(
    "other",
    BUSINESS_LOSS_LIMIT_KEYS.businessCapitalGain,
    -5000,
    `${VERBAL}: the shipyard's K-1 box 8a loss is from stock the shipyard held in its trade.`,
  ),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    `${VERBAL}: employer plan all year.`,
  ),
  fact("use_tax", "use_tax.owed_amount", 0, `${VERBAL}: no out-of-state purchases.`),
  fact("other", EIC_KEYS.nonresidentAlien, false, VERBAL),
  fact("other", EIC_KEYS.qualifyingChildOfAnother, false, VERBAL),
  fact("other", EIC_KEYS.claimableAsDependent, false, VERBAL),
  fact("other", EIC_KEYS.deniedInEarlierYear, false, VERBAL),
  fact("other", CA_EITC_KEYS.ftbDisallowedEarlierYear, false, VERBAL),
  fact(
    "self_employment",
    CA_EMPLOYEE_CLASSIFICATION_KEYS.classifiedAsEmployee,
    false,
    `${VERBAL}: an independent contractor for California too.`,
  ),
  fact(
    "other",
    CA_BUSINESS_LOSS_LIMIT_KEYS.priorYearCarryover,
    0,
    `${VERBAL}: no 2024 FTB 3461 carryover.`,
  ),
];
