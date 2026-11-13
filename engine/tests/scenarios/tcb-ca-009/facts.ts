/*
 * Source: TaxCalcBench ty25-ca-009 (README.md). Document facts copy the PDFs in
 * docs/; answer facts copy input/remaining_data.json.
 */

import {
  AMT_KEYS,
  CAPITAL_LOSS_CARRYOVER_KEYS,
  HSA_COVERAGE_KEYS,
  makeDependentFactKey,
  makeDividendFactKey,
  makeHsaDistributionFactKey,
  makeInterestFactKey,
  makeRetirementDistributionFactKey,
  makeSocialSecurityFactKey,
  makeTradeFactKey,
  makeW2FactKey,
  type DependentFactValue,
  type DividendFactValue,
  type HsaDistributionFactValue,
  type InterestFactValue,
  type RetirementDistributionFactValue,
  type SocialSecurityFactValue,
  type TradeFactValue,
  type W2FactValue,
} from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { identityFact } from "../../helpers/fixtureBuilders.js";

export const TCB_CA_009_USER_ID = "tcb-ca-009-integration";
export const TCB_CA_009_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-12T00:00:00Z";
const ANSWERS = "TaxCalcBench answers (input/remaining_data.json)";
const PAYER_TIN = "12-3456789";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TCB_CA_009_USER_ID,
  taxYear: TCB_CA_009_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

/* The taxpayer as the documents print them (generate-docs.ts reads it too). */
export const HOUSEHOLD = {
  taxpayer: { firstName: "Health", lastName: "Savings", ssn: "900-45-6789" },
  street: "1110 Grove Park Rd",
  city: "Los Angeles",
  state: "CA",
  zip: "90210",
  /* The answers' county (ca_form540.county_in_ca), although the address is in Los Angeles. */
  county: "San Diego",
};

const address = { line1: HOUSEHOLD.street, city: HOUSEHOLD.city, state: "CA", zip: "90210" };

/* docs/01-test-3-w2.pdf: no box 12, 13 or state boxes. */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "TEST 3",
  employerEin: PAYER_TIN,
  employerAddress: { line1: "111 ABC Street", city: "Detroit", state: "CA", zip: "90210" },
  employee: { ...HOUSEHOLD.taxpayer, address },
  box1: 20000,
  box2: 1117,
  box3: 20000,
  box4: 1240,
  box5: 20000,
  box6: 290,
};

// docs/02-fidelity-1099-int.pdf
const interest: InterestFactValue = { payerName: "Fidelity", box1: 17775 };

// docs/03-charles-schwab-1099-div.pdf
const dividends: DividendFactValue = {
  payerName: "Charles Schwab",
  box1a: 88545,
  box1b: 59775,
  box2a: 2260,
};

/* docs/04-charles-schwab-1099-b.pdf: a long-term sale, basis reported to the IRS (box D). */
export const SCHWAB_TRADE_ID = "schwab-d-01";
const sale: TradeFactValue = {
  tradeId: SCHWAB_TRADE_ID,
  description: "ABC Stock",
  dateAcquired: "08/10/2021",
  dateSold: "09/14/2025",
  proceeds: 10000,
  costBasis: 3884,
};

/* docs/05-charles-schwab-1099-r.pdf: a normal distribution (code 7) from a pension plan. */
const pension: RetirementDistributionFactValue = {
  payerName: "Charles Schwab",
  payerTin: PAYER_TIN,
  owner: "taxpayer",
  box1: 78778,
  box2a: 78778,
  box4: 7878,
  box7: "7",
  box7IraSepSimple: false,
};

/* docs/06: the 1099-SA with code 2, an excess contribution taken out (the answers roll it over). */
const hsaExcess: HsaDistributionFactValue = {
  payerName: "United Health Bank",
  payerTin: PAYER_TIN,
  box1: 1500,
  box2: 0,
  box3: "2",
  box5: "HSA",
};

/* docs/07: the 1099-SA with code 4, a death distribution other than code 6. */
const hsaDeath: HsaDistributionFactValue = {
  payerName: "United Health Bank",
  payerTin: PAYER_TIN,
  box1: 855,
  box3: "4",
  box4: 855,
  box5: "HSA",
};

/*
 * docs/08-ssa-1099.pdf (made by us from the answers; generate-docs.ts). The answers
 * give box 5 and no Medicare premiums; box 3 assumes nothing was repaid (box 3 = box 5).
 */
export const ssa: SocialSecurityFactValue = {
  payerName: "Social Security Administration",
  box3: 56994,
  box5: 56994,
};

/* irs1040.dependent_detail[0]: the son, born 2014, in the home all year. Name and SSN from the key. */
const son: DependentFactValue = {
  firstName: "Jesse",
  lastName: "Savings",
  ssn: "900-45-6789",
  relationship: "Son",
  dob: "08/25/2014",
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TCB_CA_009_USER_ID, taxYear: TCB_CA_009_TAX_YEAR, suffix, value });

export const tcbCa009Facts: TaxFactRow[] = [
  idFact("name.first", HOUSEHOLD.taxpayer.firstName),
  idFact("name.last", HOUSEHOLD.taxpayer.lastName),
  idFact("ssn", HOUSEHOLD.taxpayer.ssn),
  idFact("dob", "07/07/1958"),
  identityFact({
    userId: TCB_CA_009_USER_ID,
    taxYear: TCB_CA_009_TAX_YEAR,
    suffix: "spouse.year_of_death",
    value: "2023",
    sourceNote: `${ANSWERS}: basic3.FilingStatus5YSDIED.`,
  }),
  idFact("address.street", HOUSEHOLD.street),
  idFact("address.city", HOUSEHOLD.city),
  idFact("address.state", HOUSEHOLD.state),
  idFact("address.zip", HOUSEHOLD.zip),
  idFact("address.county", HOUSEHOLD.county),
  fact("wages", makeW2FactKey("test-3"), w2, "W-2 from TEST 3 (docs/01-test-3-w2.pdf)."),
  fact(
    "investment_income",
    makeInterestFactKey("fidelity"),
    interest,
    "1099-INT from Fidelity (docs/02-fidelity-1099-int.pdf).",
  ),
  fact(
    "investment_income",
    makeDividendFactKey("charles-schwab"),
    dividends,
    "1099-DIV from Charles Schwab (docs/03-charles-schwab-1099-div.pdf).",
  ),
  fact(
    "investment_income",
    makeTradeFactKey("charles-schwab", SCHWAB_TRADE_ID),
    sale,
    "1099-B from Charles Schwab (docs/04-charles-schwab-1099-b.pdf).",
  ),
  fact(
    "retirement",
    makeRetirementDistributionFactKey("charles-schwab", "schwab-1"),
    pension,
    "1099-R from Charles Schwab (docs/05-charles-schwab-1099-r.pdf).",
  ),
  fact(
    "hsa",
    makeHsaDistributionFactKey("united-health-bank", "code-2"),
    hsaExcess,
    "1099-SA from United Health Bank, code 2 (docs/06-united-health-bank-1099-sa-code-2.pdf).",
  ),
  fact(
    "hsa",
    makeHsaDistributionFactKey("united-health-bank", "code-4"),
    hsaDeath,
    "1099-SA from United Health Bank, code 4 (docs/07-united-health-bank-1099-sa-code-4.pdf).",
  ),
  fact("retirement", makeSocialSecurityFactKey("ssa"), ssa, "SSA-1099 (docs/08-ssa-1099.pdf)."),
  fact(
    "dependents",
    makeDependentFactKey("jesse-savings"),
    son,
    `${ANSWERS}: irs1040.dependent_detail[0]; the name and SSN from the key's dependent row.`,
  ),
  fact(
    "capital_gains",
    CAPITAL_LOSS_CARRYOVER_KEYS.longTerm,
    11166,
    `${ANSWERS}: irs1040_schedule_d.lt_capital_loss_carryover_input.`,
  ),
  /* HSA answers (hsa, hsa_addtl, hsa_dist). */
  fact(
    "hsa",
    HSA_COVERAGE_KEYS.coverageType,
    "self-only",
    `${ANSWERS}: hsaLastMonthRuleStatusTP SELF.`,
  ),
  fact("hsa", HSA_COVERAGE_KEYS.coverageMonths, 6, `${ANSWERS}: hsaMonthsCoverSelfTP 6.`),
  fact("hsa", HSA_COVERAGE_KEYS.ownContributions, 2500, `${ANSWERS}: hsa.hsaContribCurYrTP.`),
  fact(
    "hsa",
    HSA_COVERAGE_KEYS.distributionsAllQualified,
    false,
    `${ANSWERS}: hsa_dist.unreimbQualMedExpORTP 0 (no qualified medical expenses paid from the HSA).`,
  ),
  fact(
    "hsa",
    HSA_COVERAGE_KEYS.rolledOverOrExcessWithdrawn,
    1500,
    `${ANSWERS}: hsa_dist.hsaRolloverTP (the code 2 distribution, docs/06).`,
  ),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    `${ANSWERS}: ca_form540.full_year_health_coverage.`,
  ),
  fact("other", "use_tax.owed_amount", 0, `${ANSWERS}: ca_form540.use_tax.`),
  fact("charitable", "charitable.cash", 25000, `${ANSWERS}: scha_gft.cash60.`),
  fact("medical", "medical.expenses_total", 0, `${ANSWERS}: med_exp.medExpDrDentistTP 0.`),
  /* f6251.stockOption: the incentive stock option spread (Schedule P (540) and Form 6251). */
  fact("other", AMT_KEYS.isoExerciseSpread, 50000, `${ANSWERS}: f6251.stockOption.`),
];
