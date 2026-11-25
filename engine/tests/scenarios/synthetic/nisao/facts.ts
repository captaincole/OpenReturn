/*
 * A made-up taxpayer (README.md): every name and amount is invented. The
 * documents have no PDFs: their facts are the boxes as they would print them.
 * The rest are his answers.
 */

import {
  CA_BUSINESS_LOSS_LIMIT_KEYS,
  CA_EITC_KEYS,
  CA_EMPLOYEE_CLASSIFICATION_KEYS,
  EIC_KEYS,
  makeBusinessFactKey,
  makeK1HoldingFactKey,
  makeSCorporationK1FactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type K1HoldingFactValue,
  type SCorporationK1FactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const NISAO_USER_ID = "nisao-synthetic";
export const NISAO_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-24T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: NISAO_USER_ID,
  taxYear: NISAO_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const NISAO = {
  taxpayer: { firstName: "Nisao", lastName: "Merrow", ssn: "400-00-3462" },
  street: "88 Shienar Court",
  city: "San Jose",
  state: "CA",
  zip: "95112",
};

const address = { line1: NISAO.street, city: NISAO.city, state: NISAO.state, zip: NISAO.zip };
const street = { street: NISAO.street, city: NISAO.city, state: NISAO.state, zip: NISAO.zip };

/* His W-2 from the hospital where he is chief of surgery. */
const w2: W2FactValue = {
  employerName: "Fal Dara Medical Center",
  employerEin: "00-0034621",
  employerAddress: { line1: "1 Tower Road", city: "San Jose", state: "CA", zip: "95110" },
  employee: { ...NISAO.taxpayer, address },
  box1: 420000,
  box2: 95000,
  box3: 176100,
  box4: 10918.2,
  box5: 420000,
  box6: 7710,
  box15: "CA",
  box16: 420000,
  box17: 36000,
};

/* His surgical consulting business (Schedule C), with a profit. */
const consulting: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Surgical practice consulting",
  code: "541600",
  name: "Merrow Surgical Advisors",
  address: street,
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 130000,
  expenses: { travel: 12000, legalAndProfessional: 8000, supplies: 10000 },
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

/* The K-1 of the surgical instrument maker he owns and runs (an S corporation). */
const MAKER_ID = "malkier-instruments";
const makerK1: SCorporationK1FactValue = {
  form: "1120-S",
  entityName: "Malkier Instruments, Inc.",
  entityEin: "00-0034622",
  finalK1: false,
  amendedK1: false,
  allocationPercent: 100,
  sharesAtStart: 1000,
  sharesAtEnd: 1000,
  boxes: [{ box: "1", amount: -350000 }],
};

/* He runs the company; all of his money in it is at risk. */
const makerHolding: K1HoldingFactValue = {
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  stockBasisAtStart: 500000,
  stockAcquiredAs: "original_shareholder",
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: NISAO_USER_ID, taxYear: NISAO_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-24";

export const nisaoFacts: TaxFactRow[] = [
  idFact("name.first", NISAO.taxpayer.firstName),
  idFact("name.last", NISAO.taxpayer.lastName),
  idFact("ssn", NISAO.taxpayer.ssn),
  idFact("dob", "09/02/1968"),
  idFact("address.street", NISAO.street),
  idFact("address.city", NISAO.city),
  idFact("address.state", NISAO.state),
  idFact("address.zip", NISAO.zip),
  idFact("address.county", "Santa Clara"),
  idFact("occupation", "Surgeon"),
  idFact("phone", "408-555-3462"),
  fact("wages", makeW2FactKey("fal-dara-medical"), w2, "W-2 from Fal Dara Medical Center."),
  fact(
    "self_employment",
    makeBusinessFactKey("merrow-surgical-advisors"),
    consulting,
    `${VERBAL}: receipts and expenses from his ledger.`,
  ),
  fact(
    "k1",
    makeSCorporationK1FactKey(MAKER_ID),
    makerK1,
    "Schedule K-1 (Form 1120-S) from Malkier Instruments, Inc.",
  ),
  fact(
    "k1",
    makeK1HoldingFactKey(MAKER_ID),
    makerHolding,
    `${VERBAL}: stock basis from his 2024 Form 7203 line 15.`,
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
  /*
   * California did not follow the federal suspension of the limit for 2020
   * (CARES Act), so his 2020 instrument company loss left a California
   * carryover that the federal return never had.
   */
  fact(
    "other",
    CA_BUSINESS_LOSS_LIMIT_KEYS.priorYearCarryover,
    200000,
    `${VERBAL}: line 16 of his 2024 FTB 3461.`,
  ),
  fact(
    "other",
    CA_BUSINESS_LOSS_LIMIT_KEYS.priorYearAdjustmentsIncluded,
    200000,
    `${VERBAL}: the excess business loss adjustments on his earlier Schedule CA (540) line 8p column C.`,
  ),
];
