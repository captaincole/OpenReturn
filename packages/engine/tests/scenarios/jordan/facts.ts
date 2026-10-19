/*
 * Jordan A. Sample — facts (the "data").
 *
 * A fake high-income persona. Every value comes from the fake
 * source PDFs in ./docs/; fixture.json beside them was generated from the
 * same data. Identity uses the IRS test SSN range (400-00-xxxx) and
 * EINs starting 00-.
 *
 * GENERATED once from fixture.json, then owned by hand. Edit freely.
 */

import {
  HSA_COVERAGE_KEYS,
  PRIOR_YEAR_KEYS,
  makeDividendFactKey,
  makeHsaDistributionFactKey,
  makeInterestFactKey,
  makeMiscIncomeFactKey,
  makeReportedBasisFactKey,
  makeRetirementDistributionFactKey,
  makeTradeFactKey,
  makeW2FactKey,
  type DividendFactValue,
  type HsaDistributionFactValue,
  type InterestFactValue,
  type MiscIncomeFactValue,
  type RetirementDistributionFactValue,
  type TradeFactValue,
  type W2FactValue,
} from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { identityFact } from "../../helpers/fixtureBuilders.js";

export const JORDAN_USER_ID = "jordan-integration";
export const JORDAN_TAX_YEAR = 2025;

const CREATED_AT = "2026-10-15T00:00:00Z";

/** One fact row. `id` is derived from the key so it stays stable. */
const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key.replace(/[^a-z0-9]+/gi, "-")}`,
  userId: JORDAN_USER_ID,
  taxYear: JORDAN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: JORDAN_USER_ID, taxYear: JORDAN_TAX_YEAR, suffix, value });

// docs/01-example-corp-w2.pdf
const w2: W2FactValue = {
  employerName: "Example Corp",
  employerEin: "00-0000001",
  employerAddress: {
    line1: "100 Example Plaza",
    city: "Berkeley",
    state: "CA",
    zip: "94710",
  },
  employee: {
    firstName: "Jordan",
    middleInitial: "A",
    lastName: "Sample",
    ssn: "400-00-0001",
    address: {
      line1: "1500 Example Street",
      city: "Oakland",
      state: "CA",
      zip: "94612",
    },
  },
  box1: 672973.1,
  box2: 199086.91,
  box3: 176100.0,
  box4: 10918.2,
  box5: 695241.9,
  box6: 14538.18,
  box12: [
    {
      code: "C",
      amount: 636.5,
    },
    {
      code: "D",
      amount: 22268.8,
    },
    {
      code: "DD",
      amount: 10101.75,
    },
    {
      code: "W",
      amount: 3826.47,
    },
  ],
  box13: {
    statutoryEmployee: false,
    retirementPlan: true,
    thirdPartySickPay: false,
  },
  box14: [
    {
      label: "VPDI",
      amount: 5270.43,
    },
  ],
  box15: "CA",
  box16: 676799.57,
  box17: 62972.02,
};

// docs/02-example-broker-1099-consolidated.pdf — 1099-DIV, 1099-INT, 1099-MISC sections
const brokerDiv: DividendFactValue = {
  payerName: "Example Broker",
  payerTin: "00-0000002",
  box1a: 885.42,
  box1b: 864.48,
  box5: 20.94,
};

const brokerInt: InterestFactValue = {
  payerName: "Example Broker",
  payerTin: "00-0000002",
  box1: 9.59,
};

const brokerMisc: MiscIncomeFactValue = {
  payerName: "Example Broker",
  payerTin: "00-0000002",
  box3: 8.86,
};

// docs/04-example-savings-1099-int.pdf
const savingsInt: InterestFactValue = {
  payerName: "Example Savings Bank",
  payerTin: "00-0000003",
  box1: 2287.09,
};

// docs/06-example-exchange-1099-misc.pdf
const exchangeMisc: MiscIncomeFactValue = {
  payerName: "Example Digital Exchange",
  payerTin: "00-0000004",
  box3: 1045.85,
};

// docs/07 and 08 — two 1099-Rs from one payer (direct rollovers, codes G and H)
const rolloverG: RetirementDistributionFactValue = {
  payerName: "Example Retirement Trust Company",
  payerTin: "00-0000005",
  planName: "EXAMPLE CORP 401(K) SAVINGS PLAN",
  box1: 87756.36,
  box2a: 0.0,
  box2b: {
    taxableAmountNotDetermined: false,
    totalDistribution: true,
  },
  box5: 0.02,
  box7: "G",
  box7IraSepSimple: false,
  box15: "CA 000-0000-2",
};

const rolloverH: RetirementDistributionFactValue = {
  payerName: "Example Retirement Trust Company",
  payerTin: "00-0000005",
  planName: "EXAMPLE CORP 401(K) SAVINGS PLAN",
  box1: 1553.34,
  box2a: 0.0,
  box2b: {
    taxableAmountNotDetermined: false,
    totalDistribution: true,
  },
  box5: 1096.08,
  box7: "H",
  box7IraSepSimple: false,
  box11: 2021,
  box15: "CA 000-0000-2",
};

// docs/09-example-hsa-1099-sa.pdf
const hsaDist: HsaDistributionFactValue = {
  payerName: "Example HSA Custodian",
  payerTin: "00-0000006",
  box1: 144.9,
  box3: "1",
  box5: "HSA",
};

/*
 * Sales. Form 8949 box per sale lives in decisions.ts (the broker-reported
 * box decision). Box E sales have no basis and no acquired date on the
 * 1099-B; the taxpayer reports basis separately (reportedBasis below).
 */
interface Sale {
  accountSlug: string;
  doc: string;
  trade: TradeFactValue;
}

export const JORDAN_SALES: Sale[] = [
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-d-01",
      description: "91.207 sh SAMPLE GLOBAL HOLDINGS INC",
      quantity: 91.207,
      dateAcquired: "11/28/22",
      dateSold: "05/12/25",
      proceeds: 1386.3,
      costBasis: 2094.94,
    },
  },
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-d-02",
      description: "91.627 sh SAMPLE GLOBAL HOLDINGS INC",
      quantity: 91.627,
      dateAcquired: "11/28/22",
      dateSold: "05/12/25",
      proceeds: 1358.02,
      costBasis: 2088.44,
    },
  },
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-d-03",
      description: "60.208 sh SAMPLE GLOBAL HOLDINGS INC",
      quantity: 60.208,
      dateAcquired: "12/07/22",
      dateSold: "05/12/25",
      proceeds: 874.88,
      costBasis: 1284.21,
    },
  },
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-d-04",
      description: "84.604 sh SAMPLE GLOBAL HOLDINGS INC",
      quantity: 84.604,
      dateAcquired: "12/07/22",
      dateSold: "05/12/25",
      proceeds: 1380.78,
      costBasis: 2078.22,
    },
  },
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-d-05",
      description: "30.696 sh SAMPLE GLOBAL HOLDINGS INC",
      quantity: 30.696,
      dateAcquired: "12/07/22",
      dateSold: "05/09/25",
      proceeds: 446.35,
      costBasis: 686.68,
    },
  },
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-d-06",
      description: "92.951 sh SAMPLE GLOBAL HOLDINGS INC",
      quantity: 92.951,
      dateAcquired: "12/07/22",
      dateSold: "05/09/25",
      proceeds: 1292.95,
      costBasis: 1944.29,
    },
  },
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-d-07",
      description: "37.588 sh SAMPLE GLOBAL HOLDINGS INC",
      quantity: 37.588,
      dateAcquired: "12/04/22",
      dateSold: "05/09/25",
      proceeds: 484.72,
      costBasis: 736.76,
    },
  },
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-d-08",
      description: "96.399 sh SAMPLE GLOBAL HOLDINGS INC",
      quantity: 96.399,
      dateAcquired: "12/04/22",
      dateSold: "05/09/25",
      proceeds: 1239.07,
      costBasis: 2000.08,
    },
  },
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-d-09",
      description: "88.099 sh SAMPLE GLOBAL HOLDINGS INC",
      quantity: 88.099,
      dateAcquired: "12/04/22",
      dateSold: "05/09/25",
      proceeds: 1269.65,
      costBasis: 1961.87,
    },
  },
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-d-10",
      description: "95.395 sh SAMPLE GLOBAL HOLDINGS INC",
      quantity: 95.395,
      dateAcquired: "12/04/22",
      dateSold: "05/14/25",
      proceeds: 1500.36,
      costBasis: 2269.59,
    },
  },
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-d-11",
      description: "127.962 sh SAMPLE GLOBAL HOLDINGS INC",
      quantity: 127.962,
      dateAcquired: "12/04/22",
      dateSold: "05/14/25",
      proceeds: 1866.89,
      costBasis: 2991.62,
    },
  },
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-d-12",
      description: "106.200 sh SAMPLE GLOBAL HOLDINGS INC",
      quantity: 106.2,
      dateAcquired: "12/30/22",
      dateSold: "05/14/25",
      proceeds: 1486.31,
      costBasis: 2279.36,
    },
  },
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-d-13",
      description: "32.299 sh SAMPLE GLOBAL HOLDINGS INC",
      quantity: 32.299,
      dateAcquired: "12/30/22",
      dateSold: "10/29/25",
      proceeds: 1432.65,
      costBasis: 712.73,
    },
  },
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-d-14",
      description: "199.153 sh SAMPLE GLOBAL HOLDINGS INC",
      quantity: 199.153,
      dateAcquired: "12/30/22",
      dateSold: "10/29/25",
      proceeds: 7876.69,
      costBasis: 3927.82,
    },
  },
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-d-15",
      description: "143.447 sh SAMPLE GLOBAL HOLDINGS INC",
      quantity: 143.447,
      dateAcquired: "01/02/23",
      dateSold: "10/29/25",
      proceeds: 5923.44,
      costBasis: 2935.31,
    },
  },
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-d-16",
      description: "141.595 sh SAMPLE GLOBAL HOLDINGS INC",
      quantity: 141.595,
      dateAcquired: "01/12/23",
      dateSold: "10/29/25",
      proceeds: 6628.75,
      costBasis: 3409.65,
    },
  },
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-d-17",
      description: "171.062 sh SAMPLE GLOBAL HOLDINGS INC",
      quantity: 171.062,
      dateAcquired: "01/12/23",
      dateSold: "10/29/25",
      proceeds: 7519.46,
      costBasis: 4068.07,
    },
  },
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-d-18",
      description: "1,283.162 sh TEST ORBITAL CORP",
      quantity: 1.0,
      dateAcquired: "04/14/24",
      dateSold: "07/10/25",
      proceeds: 34074.48,
      costBasis: 2651.95,
    },
  },
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-d-19",
      description: "644.647 sh TEST ORBITAL CORP",
      quantity: 644.647,
      dateAcquired: "04/14/24",
      dateSold: "10/10/25",
      proceeds: 24052.63,
      costBasis: 1358.9,
    },
  },
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-e-01",
      description: "0.800 sh SAMPLE GLOBAL HOLDINGS INC",
      quantity: 0.8,
      dateSold: "04/11/25",
      proceeds: 6.53,
    },
  },
  {
    accountSlug: "example-broker",
    doc: "02",
    trade: {
      tradeId: "exb-e-02",
      description: "19.000 sh SAMPLE GLOBAL HOLDINGS INC",
      quantity: 19.0,
      dateSold: "05/12/25",
      proceeds: 298.92,
    },
  },
  {
    accountSlug: "example-broker-stock-plan",
    doc: "03",
    trade: {
      tradeId: "exbsp-b-01",
      description: "91.626 sh EXAMPLE CORP CL C",
      quantity: 91.626,
      dateAcquired: "01/15/25",
      dateSold: "02/14/25",
      proceeds: 36122.35,
      costBasis: 37702.28,
    },
  },
  {
    accountSlug: "example-broker-stock-plan",
    doc: "03",
    trade: {
      tradeId: "exbsp-b-02",
      description: "69.572 sh EXAMPLE CORP CL C",
      quantity: 69.572,
      dateAcquired: "02/11/25",
      dateSold: "03/09/25",
      proceeds: 22311.85,
      costBasis: 23822.47,
    },
  },
  {
    accountSlug: "example-broker-stock-plan",
    doc: "03",
    trade: {
      tradeId: "exbsp-b-03",
      description: "98.308 sh EXAMPLE CORP CL C",
      quantity: 98.308,
      dateAcquired: "03/14/25",
      dateSold: "04/13/25",
      proceeds: 25814.27,
      costBasis: 28510.56,
    },
  },
  {
    accountSlug: "example-broker-stock-plan",
    doc: "03",
    trade: {
      tradeId: "exbsp-b-04",
      description: "97.997 sh EXAMPLE CORP CL C",
      quantity: 97.997,
      dateAcquired: "05/10/25",
      dateSold: "05/12/25",
      proceeds: 26996.18,
      costBasis: 27019.8,
    },
  },
  {
    accountSlug: "example-broker-stock-plan",
    doc: "03",
    trade: {
      tradeId: "exbsp-b-05",
      description: "91.064 sh EXAMPLE CORP CL C",
      quantity: 91.064,
      dateAcquired: "05/21/25",
      dateSold: "06/14/25",
      proceeds: 28579.93,
      costBasis: 28184.45,
    },
  },
  {
    accountSlug: "example-broker-stock-plan",
    doc: "03",
    trade: {
      tradeId: "exbsp-b-06",
      description: "96.839 sh EXAMPLE CORP CL C",
      quantity: 96.839,
      dateAcquired: "06/10/25",
      dateSold: "06/18/25",
      proceeds: 30122.38,
      costBasis: 28667.9,
    },
  },
  {
    accountSlug: "example-broker-stock-plan",
    doc: "03",
    trade: {
      tradeId: "exbsp-b-07",
      description: "101.310 sh EXAMPLE CORP CL C",
      quantity: 101.31,
      dateAcquired: "07/20/25",
      dateSold: "08/09/25",
      proceeds: 32939.06,
      costBasis: 33271.62,
    },
  },
  {
    accountSlug: "example-exchange",
    doc: "05",
    trade: {
      tradeId: "exd-h-01",
      description: "0.242151 EXAMPLECOIN",
      quantity: 0.242151,
      dateAcquired: "VARIOUS",
      dateSold: "01/30/25",
      proceeds: 0.09,
      costBasis: 0.17,
    },
  },
  {
    accountSlug: "example-exchange",
    doc: "05",
    trade: {
      tradeId: "exd-h-02",
      description: "0.0000122 SAMPLETOKEN",
      quantity: 1.22e-5,
      dateAcquired: "01/17/25",
      dateSold: "01/24/25",
      proceeds: 0.59,
      costBasis: 0.54,
    },
  },
  {
    accountSlug: "example-exchange",
    doc: "05",
    trade: {
      tradeId: "exd-h-03",
      description: "0.000539 TESTCHAIN",
      quantity: 0.000539,
      dateAcquired: "11/23/24",
      dateSold: "01/17/25",
      proceeds: 1.14,
      costBasis: 1.32,
    },
  },
];

/** Form 8949 box per tradeId, as the broker reported it. */
export const JORDAN_BOXES: Record<string, string> = {
  "exb-d-01": "partII.boxD",
  "exb-d-02": "partII.boxD",
  "exb-d-03": "partII.boxD",
  "exb-d-04": "partII.boxD",
  "exb-d-05": "partII.boxD",
  "exb-d-06": "partII.boxD",
  "exb-d-07": "partII.boxD",
  "exb-d-08": "partII.boxD",
  "exb-d-09": "partII.boxD",
  "exb-d-10": "partII.boxD",
  "exb-d-11": "partII.boxD",
  "exb-d-12": "partII.boxD",
  "exb-d-13": "partII.boxD",
  "exb-d-14": "partII.boxD",
  "exb-d-15": "partII.boxD",
  "exb-d-16": "partII.boxD",
  "exb-d-17": "partII.boxD",
  "exb-d-18": "partII.boxD",
  "exb-d-19": "partII.boxD",
  "exb-e-01": "partII.boxE",
  "exb-e-02": "partII.boxE",
  "exbsp-b-01": "partI.boxB",
  "exbsp-b-02": "partI.boxB",
  "exbsp-b-03": "partI.boxB",
  "exbsp-b-04": "partI.boxB",
  "exbsp-b-05": "partI.boxB",
  "exbsp-b-06": "partI.boxB",
  "exbsp-b-07": "partI.boxB",
  "exd-h-01": "partI.boxH",
  "exd-h-02": "partI.boxH",
  "exd-h-03": "partI.boxH",
};

export const jordanFacts: TaxFactRow[] = [
  idFact("name.first", "Jordan"),
  idFact("name.middle_initial", "A"),
  idFact("name.last", "Sample"),
  idFact("ssn", "400-00-0001"),
  idFact("dob", "04/12/1985"),
  idFact("address.street", "1500 Example Street"),
  idFact("address.city", "Oakland"),
  idFact("address.state", "CA"),
  idFact("address.zip", "94612"),
  idFact("address.county", "Alameda"),
  fact("wages", makeW2FactKey("example-corp"), w2, "W-2 from Example Corp (docs/01)."),
  fact(
    "investment_income",
    makeDividendFactKey("example-broker"),
    brokerDiv,
    "Example Broker consolidated 1099-DIV (docs/02).",
  ),
  fact(
    "investment_income",
    makeInterestFactKey("example-broker"),
    brokerInt,
    "Example Broker consolidated 1099-INT (docs/02).",
  ),
  fact(
    "other",
    makeMiscIncomeFactKey("example-broker"),
    brokerMisc,
    "Example Broker consolidated 1099-MISC (docs/02).",
  ),
  fact(
    "investment_income",
    makeInterestFactKey("example-savings"),
    savingsInt,
    "Example Savings Bank 1099-INT (docs/04).",
  ),
  fact(
    "other",
    makeMiscIncomeFactKey("example-exchange"),
    exchangeMisc,
    "Example Digital Exchange 1099-MISC (docs/06).",
  ),
  fact(
    "retirement",
    makeRetirementDistributionFactKey("example-retirement-trust-company", "code-g"),
    rolloverG,
    "1099-R code G (docs/07).",
  ),
  fact(
    "retirement",
    makeRetirementDistributionFactKey("example-retirement-trust-company", "code-h"),
    rolloverH,
    "1099-R code H (docs/08).",
  ),
  fact(
    "hsa",
    makeHsaDistributionFactKey("example-hsa", "code-1"),
    hsaDist,
    "Example HSA Custodian 1099-SA (docs/09).",
  ),
  ...JORDAN_SALES.map(({ accountSlug, doc, trade }) =>
    fact(
      "investment_income",
      makeTradeFactKey(accountSlug, trade.tradeId),
      trade,
      `Sale on docs/${doc}.`,
    ),
  ),
  fact(
    "capital_gains",
    makeReportedBasisFactKey("example-broker", "exb-e-01"),
    0.0,
    "Verbal: taxpayer-reported basis; not on the 1099-B.",
  ),
  fact(
    "capital_gains",
    makeReportedBasisFactKey("example-broker", "exb-e-02"),
    0.0,
    "Verbal: taxpayer-reported basis; not on the 1099-B.",
  ),
  fact("hsa", HSA_COVERAGE_KEYS.coverageType, "self-only", "Verbal: HDHP self-only coverage."),
  fact("hsa", HSA_COVERAGE_KEYS.coverageMonths, 12, "Verbal: covered all 12 months."),
  fact("hsa", HSA_COVERAGE_KEYS.ownContributions, 0, "Verbal: no contributions outside payroll."),
  fact(
    "hsa",
    HSA_COVERAGE_KEYS.distributionsAllQualified,
    true,
    "Verbal: distribution paid qualified medical expenses.",
  ),
  fact("estimated_payments", PRIOR_YEAR_KEYS.federalAgi, 593636, "Verbal: 2024 Form 1040 line 11."),
  fact(
    "estimated_payments",
    PRIOR_YEAR_KEYS.federalTax,
    188456,
    "Verbal: 2024 total tax (Form 2210 line 8 value).",
  ),
  fact("estimated_payments", PRIOR_YEAR_KEYS.caTax, 58502, "Verbal: 2024 Form 540 total tax."),
  fact(
    "estimated_payments",
    PRIOR_YEAR_KEYS.caBalancePaidThisYear,
    2606,
    "Verbal: 2024 CA balance due, paid in 2025.",
  ),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    "Verbal: employer HDHP covered all 12 months.",
  ),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases requiring use tax."),
];
