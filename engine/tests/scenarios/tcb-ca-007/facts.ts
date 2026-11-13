/*
 * Source: TaxCalcBench ty25-ca-007 (README.md). Document facts copy the PDFs in
 * docs/; answer facts copy input/remaining_data.json.
 */

import {
  ADJUSTMENT_KEYS,
  CA_EMPLOYEE_CLASSIFICATION_KEYS,
  CA_MISC_DEDUCTION_KEYS,
  GAMBLING_KEYS,
  INVESTMENT_INTEREST_KEYS,
  ITEMIZED_OTHER_KEYS,
  MORTGAGE_KEYS,
  OTHER_INCOME_KEYS,
  SPOUSE_KEYS,
  makeBusinessFactKey,
  makeDependentFactKey,
  makeDisabilityBeforeMinimumRetirementAgeKey,
  makeDividendFactKey,
  makeGamblingWinningsFactKey,
  makeMiscIncomeFactKey,
  makeRentalFactKey,
  makeRetirementDistributionFactKey,
  makeRothIraFactKey,
  makeTraditionalIraFactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type DependentFactValue,
  type DividendFactValue,
  type GamblingWinningsFactValue,
  type MiscIncomeFactValue,
  type OtherIncomeItem,
  type RentalFactValue,
  type RetirementDistributionFactValue,
  type RothIraFactValue,
  type TraditionalIraFactValue,
  type W2FactValue,
} from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { identityFact } from "../../helpers/fixtureBuilders.js";

export const TCB_CA_007_USER_ID = "tcb-ca-007-integration";
export const TCB_CA_007_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-12T00:00:00Z";
const ANSWERS = "TaxCalcBench answers (input/remaining_data.json)";
const PAYER_TIN = "12-3456789";
const SSN = "900-45-6789";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TCB_CA_007_USER_ID,
  taxYear: TCB_CA_007_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const HOUSEHOLD = {
  taxpayer: { firstName: "State", lastName: "Married", ssn: SSN },
  spouse: { firstName: "Spouse", lastName: "Married", ssn: SSN },
  street: "1111 Grove Park Rd",
  city: "Los Angeles",
  state: "CA",
  zip: "90210",
  county: "Los Angeles",
};

const address = { line1: HOUSEHOLD.street, city: HOUSEHOLD.city, state: "CA", zip: "90210" };

// docs/01-employer-one-w2.pdf: no state boxes; box 12 codes AA and H.
const w2: W2FactValue = {
  employerName: "Employer One",
  employerEin: PAYER_TIN,
  employerAddress: { line1: "111 Test St", city: "Los Angeles", state: "CA", zip: "90210" },
  employee: { ...HOUSEHOLD.taxpayer, address },
  box1: 35000,
  box2: 3500,
  box3: 35000,
  box4: 2170,
  box5: 35000,
  box6: 508,
  box12: [
    { code: "AA", amount: 2500 },
    { code: "H", amount: 47 },
  ],
  box13: { retirementPlan: true },
};

// docs/02-casino-w2g.pdf
const w2g: GamblingWinningsFactValue = {
  payerName: "Casino",
  payerTin: PAYER_TIN,
  box1: 600,
  box2: "11/14/2025",
  box3: "Slots",
  box4: 60,
  box13: "CA/123456789",
  box14: 600,
  box15: 6,
};

// docs/04-etrade-1099-div.pdf
const dividends: DividendFactValue = {
  payerName: "ETRADE",
  payerTin: PAYER_TIN,
  box1a: 75,
  box1b: 75,
  box2a: 20,
};

/* docs/05 and docs/06: box 5 for the Accounting business; docs/07: box 3 for the brew distribution business. */
const ACCOUNTING_ID = "accounting";
const BREW_ID = "spoetzel-brew-distribution";
const accountingMisc1: MiscIncomeFactValue = {
  payerName: "Misc Income",
  payerTin: PAYER_TIN,
  businessId: ACCOUNTING_ID,
  box4: 3,
  box5: 500,
};
const accountingMisc2: MiscIncomeFactValue = {
  payerName: "Misc Income",
  payerTin: PAYER_TIN,
  businessId: ACCOUNTING_ID,
  box4: 4,
  box5: 100,
};
const brewMisc: MiscIncomeFactValue = {
  payerName: "Misc Income",
  payerTin: PAYER_TIN,
  businessId: BREW_ID,
  box3: 200,
  box4: 5,
};

/* The five 1099-Rs (docs/08 to docs/12), in the answers' order. */
const schwab = { payerName: "Charles Schwab", payerTin: PAYER_TIN };
const caState = { box15: "CA/123456789" };
const earlyPension: RetirementDistributionFactValue = {
  ...schwab,
  ...caState,
  box1: 1000,
  box2a: 1000,
  box4: 100,
  box7: "1",
  box7IraSepSimple: false,
  box14: 10,
  box16: 1000,
};
const earlyPensionException: RetirementDistributionFactValue = {
  ...schwab,
  ...caState,
  box1: 200,
  box2a: 200,
  box4: 20,
  box7: "2",
  box7IraSepSimple: false,
  box14: 2,
  box16: 200,
};
const disabilityPension: RetirementDistributionFactValue = {
  payerName: "Fidelity Advisors",
  payerTin: PAYER_TIN,
  ...caState,
  box1: 300,
  box2a: 300,
  box4: 30,
  box7: "3",
  box7IraSepSimple: false,
  box14: 30,
  box16: 300,
};
const directRollover: RetirementDistributionFactValue = {
  ...schwab,
  box1: 7000,
  box2a: 0,
  box7: "G",
  box7IraSepSimple: false,
};
const rothDistribution: RetirementDistributionFactValue = {
  payerName: "JP Morgan",
  payerTin: PAYER_TIN,
  box1: 4001,
  box2a: 4001,
  box7: "J",
  box7IraSepSimple: false,
};

/* f8606_ui and ira: a $2,000 basis, a $2,000 year-end value, $2,000 contributed for 2025 (all deducted). */
const traditionalIra: TraditionalIraFactValue = {
  contributions: 2000,
  nondeductibleContributions: 0,
  basisPriorYears: 2000,
  yearEndValue: 2000,
  rolledOver: 0,
  convertedToRoth: 0,
};

/* f8606_rd: the Roth IRA basis answers. No first-time homebuyer expenses or rollovers are given. */
const rothIra: RothIraFactValue = {
  contributionBasis: 5000,
  conversionAndRolloverBasis: 1750,
  firstTimeHomebuyerExpenses: 0,
  notOnLine19: 0,
};

/* irs1040_schedulec[0]: consulting with a home office by Form 8829 (need_8829 "F"), all in a rented home. */
const consulting: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Consulting",
  code: "999999",
  name: "Consultant",
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 10000,
  homeOfficeActual: {
    businessSquareFeet: 327,
    homeSquareFeet: 2950,
    allGrossIncomeFromHome: true,
    ownsHome: false,
    indirect: { insurance: 185, rent: 16000, repairsAndMaintenance: 1427, utilities: 4225 },
  },
  allInvestmentAtRisk: true,
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

/*
 * irs1040_schedulec[1]: accounting, paid on two 1099-MISCs (box 5). Depreciation
 * on older assets ($1,000) and amortization: two costs that begin in 2025, the
 * $100 of older costs, and the $2,500 amortized without a form (both older).
 */
const accounting: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Accounting",
  code: "999999",
  accountingMethod: "cash",
  materiallyParticipated: true,
  sellsGoods: false,
  grossReceipts: 600,
  expenses: { office: 800 },
  depreciation: {
    priorYearMacrs: 1000,
    amortizedCosts: [
      {
        description: "description 1",
        beginsOn: "2025-03-03",
        amount: 200,
        codeSection: "12",
        periodMonths: 12,
      },
      {
        description: "description 2",
        beginsOn: "2025-05-05",
        amount: 400,
        codeSection: "17",
        periodMonths: 12,
      },
    ],
    priorYearAmortization: 2600,
  },
  allInvestmentAtRisk: true,
  specifiedService: true,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

/* irs1040_schedulec[2]: brew distribution, paid on one 1099-MISC (box 3). */
const brewDistribution: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Spoetzel Brew Distribution",
  code: "493100",
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 200,
  allInvestmentAtRisk: true,
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

/* scherentslist[0]: a self-rental with one 5-year asset placed in service 2025-01-01. */
const selfRental: RentalFactValue = {
  owner: "taxpayer",
  propertyType: "self_rental",
  address: { street: "1 Address", city: "City", state: "FL", zip: "33755" },
  fairRentalDays: 365,
  personalUseDays: 0,
  rentsReceived: 10000,
  expenses: { advertising: 500 },
  depreciation: {
    assets: [
      {
        description: "CY 5YR HY 200DB 60% Bonus",
        placedInService: "2025-01-01",
        cost: 10000,
        businessUsePercent: 100,
        recoveryClass: "5_year",
        method: "200DB",
        convention: "HY",
      },
    ],
  },
  activeParticipation: true,
  allInvestmentAtRisk: true,
  qualifiedBusiness: true,
};

/* irs1040.dependent_detail[0–2]; names, SSNs and relationships from the key's 540. */
const dependent = (
  firstName: string,
  relationship: string,
  dob: string,
  fullTimeStudent: boolean,
): DependentFactValue => ({
  firstName,
  lastName: "Married",
  ssn: SSN,
  relationship,
  dob,
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent,
  permanentlyDisabled: false,
});

const otherIncomeItems: OtherIncomeItem[] = [
  { description: "Misc 1", amount: 86 },
  { description: "Misc 2", amount: 96 },
  { description: "Misc 3", amount: 106 },
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TCB_CA_007_USER_ID, taxYear: TCB_CA_007_TAX_YEAR, suffix, value });

const identity: TaxFactRow[] = [
  idFact("name.first", HOUSEHOLD.taxpayer.firstName),
  idFact("name.last", HOUSEHOLD.taxpayer.lastName),
  idFact("ssn", SSN),
  idFact("dob", "03/10/1982"),
  idFact("address.street", HOUSEHOLD.street),
  idFact("address.city", HOUSEHOLD.city),
  idFact("address.state", HOUSEHOLD.state),
  idFact("address.zip", HOUSEHOLD.zip),
  idFact("address.county", HOUSEHOLD.county),
  fact("identity", SPOUSE_KEYS.firstName, "Spouse", "The key's 540 (SpouseRDPFilingSeparateName)."),
  fact("identity", SPOUSE_KEYS.lastName, "Married", "The key's 540 (SpouseRDPFilingSeparateName)."),
  fact("identity", SPOUSE_KEYS.ssn, SSN, "The key's 540 (SpouseRDPFilingSeparateName)."),
  fact("identity", SPOUSE_KEYS.dob, "09/22/1985", `${ANSWERS}: sp_date_of_birth.`),
  fact("filing_status", SPOUSE_KEYS.itemizesSeparately, true, `${ANSWERS}: mfs_deduction.`),
  fact("filing_status", SPOUSE_KEYS.livedApartAllYear, true, `${ANSWERS}: livedApartFromSpouse.`),
  fact(
    "filing_status",
    SPOUSE_KEYS.livedApartLastSixMonths,
    true,
    `${ANSWERS}: irs2441.lived_apart.`,
  ),
  fact(
    "filing_status",
    SPOUSE_KEYS.legallySeparatedApartAtYearEnd,
    true,
    `${ANSWERS}: basic3.legallySeparated.`,
  ),
];

const documents: TaxFactRow[] = [
  fact("wages", makeW2FactKey("employer-one"), w2, "W-2 from Employer One (docs/01)."),
  fact(
    "other",
    makeGamblingWinningsFactKey("tin-12-3456789", "11-14-2025-600"),
    w2g,
    "W-2G from Casino (docs/02-casino-w2g.pdf).",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.interestForm1098,
    9100,
    "Form 1098 from Chase Bank, box 1 (docs/03-chase-bank-1098.pdf).",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.outstandingPrincipalForm1098,
    0,
    "Form 1098 box 2 is blank and the answers give no principal; 0 keeps the key's full line 8a (README).",
  ),
  fact(
    "investment_income",
    makeDividendFactKey("etrade"),
    dividends,
    "1099-DIV from ETRADE (docs/04-etrade-1099-div.pdf).",
  ),
  fact("other", makeMiscIncomeFactKey("misc-income-1"), accountingMisc1, "1099-MISC (docs/05)."),
  fact("other", makeMiscIncomeFactKey("misc-income-2"), accountingMisc2, "1099-MISC (docs/06)."),
  fact("other", makeMiscIncomeFactKey("misc-income-3"), brewMisc, "1099-MISC (docs/07)."),
  fact(
    "retirement",
    makeRetirementDistributionFactKey("charles-schwab", "code-1"),
    earlyPension,
    "1099-R from Charles Schwab (docs/08-charles-schwab-1099-r-code-1.pdf).",
  ),
  fact(
    "retirement",
    makeRetirementDistributionFactKey("charles-schwab", "code-2"),
    earlyPensionException,
    "1099-R from Charles Schwab (docs/09-charles-schwab-1099-r-code-2.pdf).",
  ),
  fact(
    "retirement",
    makeRetirementDistributionFactKey("fidelity-advisors", "code-3"),
    disabilityPension,
    "1099-R from Fidelity Advisors (docs/10-fidelity-advisors-1099-r-code-3.pdf).",
  ),
  fact(
    "retirement",
    makeRetirementDistributionFactKey("charles-schwab", "code-g"),
    directRollover,
    "1099-R from Charles Schwab (docs/11-charles-schwab-1099-r-code-g.pdf).",
  ),
  fact(
    "retirement",
    makeRetirementDistributionFactKey("jp-morgan", "code-j"),
    rothDistribution,
    "1099-R from JP Morgan (docs/12-jp-morgan-1099-r-code-j.pdf).",
  ),
];

const activities: TaxFactRow[] = [
  fact(
    "self_employment",
    makeBusinessFactKey("consulting"),
    consulting,
    `${ANSWERS}: irs1040_schedulec[0] and its irs8829_home_expenses.`,
  ),
  fact(
    "self_employment",
    makeBusinessFactKey(ACCOUNTING_ID),
    accounting,
    `${ANSWERS}: irs1040_schedulec[1]; gross receipts are the two 1099-MISC box 5 amounts.`,
  ),
  fact(
    "self_employment",
    makeBusinessFactKey(BREW_ID),
    brewDistribution,
    `${ANSWERS}: irs1040_schedulec[2]; gross receipts are the 1099-MISC box 3 amount.`,
  ),
  fact("rental", makeRentalFactKey("property-1"), selfRental, `${ANSWERS}: scherentslist[0].`),
  fact("rental", "rental.payments_require_1099", true, `${ANSWERS}: sche_gen.require1099.`),
  fact("rental", "rental.filed_required_1099s", false, `${ANSWERS}: sche_gen.require1099filed.`),
  fact("rental", "rental.real_estate_professional", false, "Not in the answers: no hours given."),
];

const dependents: TaxFactRow[] = [
  fact(
    "dependents",
    makeDependentFactKey("brewster"),
    dependent("Brewster", "Son", "11/18/2023", false),
    `${ANSWERS}: irs1040.dependent_detail[0]; the name from the key.`,
  ),
  fact(
    "dependents",
    makeDependentFactKey("daisy"),
    dependent("Daisy", "Daughter", "08/01/2005", true),
    `${ANSWERS}: irs1040.dependent_detail[1]; the name from the key.`,
  ),
  fact(
    "dependents",
    makeDependentFactKey("skipper"),
    dependent("Skipper", "Son", "09/08/2007", false),
    `${ANSWERS}: irs1040.dependent_detail[2]; the name from the key.`,
  ),
];

const retirementAnswers: TaxFactRow[] = [
  fact(
    "retirement",
    makeTraditionalIraFactKey("taxpayer"),
    traditionalIra,
    `${ANSWERS}: ira.IRAcontributionTP, f8606_ui.`,
  ),
  fact("retirement", makeRothIraFactKey("taxpayer"), rothIra, `${ANSWERS}: f8606_rd.`),
  fact(
    "retirement",
    makeDisabilityBeforeMinimumRetirementAgeKey("fidelity-advisors", "code-3"),
    false,
    `${ANSWERS}: f1099r[2].supplemental_inputs.notRetirementAge.`,
  ),
];

const schedule1Answers: TaxFactRow[] = [
  fact("other", OTHER_INCOME_KEYS.alimonyReceived, 666, `${ANSWERS}: alimonyReceivedTP.`),
  fact(
    "other",
    OTHER_INCOME_KEYS.alimonyReceivedAgreementDate,
    "2016-08-08",
    `${ANSWERS}: alimonyRecDate.`,
  ),
  fact("other", OTHER_INCOME_KEYS.juryDutyPay, 26, `${ANSWERS}: juryPayTP.`),
  fact("other", OTHER_INCOME_KEYS.prizesAndAwards, 36, `${ANSWERS}: prizesAwardsTP.`),
  fact("other", OTHER_INCOME_KEYS.stockOptions, 46, `${ANSWERS}: stockOptionsTP.`),
  fact("other", OTHER_INCOME_KEYS.otherItems, otherIncomeItems, `${ANSWERS}: otherIncome1–3.`),
  fact("other", GAMBLING_KEYS.winningsNotOnW2G, 50, `${ANSWERS}: OtherGamblingIncomeAmtTP.`),
  fact(
    "other",
    ADJUSTMENT_KEYS.selfEmployedPlanDeduction,
    1270,
    `${ANSWERS}: irs1040_schedulec[0].keogh_contributions.`,
  ),
  fact("other", ADJUSTMENT_KEYS.alimonyPaid, 555, `${ANSWERS}: alimonyPaidAmount.`),
  fact("other", ADJUSTMENT_KEYS.alimonyRecipientSsn, SSN, `${ANSWERS}: alimonyPaidID.`),
  fact(
    "other",
    ADJUSTMENT_KEYS.alimonyPaidAgreementDate,
    "2017-08-08",
    `${ANSWERS}: alimonyPaidDate.`,
  ),
  fact("other", ADJUSTMENT_KEYS.juryDutyPayToEmployer, 7, `${ANSWERS}: JURY_PAYAdjustmentTP.`),
  fact("other", ADJUSTMENT_KEYS.reforestation, 17, `${ANSWERS}: refstTP.`),
  fact(
    "other",
    ADJUSTMENT_KEYS.tradeActBenefitRepayment,
    27,
    `${ANSWERS}: SUB_PAY_TRAAdjustmentTP.`,
  ),
  fact("other", ADJUSTMENT_KEYS.discriminationClaimFees, 37, `${ANSWERS}: attorneyFees.`),
  fact("other", ADJUSTMENT_KEYS.whistleblowerAwardFees, 47, `${ANSWERS}: attorneyFeesIRSAward.`),
];

/* Schedule A answers (scha_*, med_exp). Medical is the four med_exp amounts added. */
const scheduleAAnswers: TaxFactRow[] = [
  fact(
    "medical",
    "medical.expenses_total",
    8300,
    `${ANSWERS}: med_exp 4,100 + 2,500 + 1,200 + 500.`,
  ),
  fact("state_local_tax", "state_local_tax.general_sales_tax", 1068, `${ANSWERS}: salesTaxesPaid.`),
  fact("state_local_tax", "state_local_tax.real_estate", 3682, `${ANSWERS}: scha_tax.taxRE.`),
  fact("state_local_tax", "state_local_tax.personal_property", 250, `${ANSWERS}: scha_tax.taxPP.`),
  fact("state_local_tax", ITEMIZED_OTHER_KEYS.otherTaxes, 500, `${ANSWERS}: scha_tax.taxAmt1.`),
  fact(
    "state_local_tax",
    ITEMIZED_OTHER_KEYS.otherTaxesDescription,
    "other taxes",
    `${ANSWERS}: scha_tax.taxType1.`,
  ),
  fact("charitable", "charitable.cash", 7500, `${ANSWERS}: scha_gft.cash60.`),
  fact("charitable", "charitable.noncash", 0, `${ANSWERS}: scha_gft.nonCash50.`),
  fact("charitable", "charitable.carryover", 0, "Not in the answers: no carryover given."),
  fact("other", GAMBLING_KEYS.losses, 500, `${ANSWERS}: scha_oth.miscNot2Amt2 (gambling losses).`),
  fact(
    "other",
    ITEMIZED_OTHER_KEYS.impairmentRelatedWorkExpenses,
    100,
    `${ANSWERS}: scha_oth.miscNot2Amt1.`,
  ),
  fact(
    "investment_income",
    INVESTMENT_INTEREST_KEYS.expensePaid,
    0,
    `${ANSWERS}: f4952 gives no 2025 interest.`,
  ),
  fact(
    "investment_income",
    INVESTMENT_INTEREST_KEYS.disallowedCarryover,
    60,
    `${ANSWERS}: f4952.COfromBefore.`,
  ),
  fact(
    "investment_income",
    INVESTMENT_INTEREST_KEYS.electedQualifiedDividendsAndGain,
    60,
    `${ANSWERS}: f4952.qualDivLineElectedInvest.`,
  ),
  fact(
    "investment_income",
    INVESTMENT_INTEREST_KEYS.investmentExpenses,
    0,
    `${ANSWERS}: no investment expenses given.`,
  ),
  fact(
    "investment_income",
    INVESTMENT_INTEREST_KEYS.caDisallowedCarryover,
    60,
    "The key's FTB 3526 line 2: the one carryover (f4952.COfromBefore) applied to California.",
  ),
  fact(
    "investment_income",
    INVESTMENT_INTEREST_KEYS.caAmtDisallowedCarryover,
    60,
    "Not in the case: Schedule P (540) line 7 takes last year's AMT carryover equal to the regular one.",
  ),
  fact(
    "investment_income",
    INVESTMENT_INTEREST_KEYS.caElectedNetCapitalGain,
    20,
    "The key's FTB 3526 line 4e: the net capital gain elected for California.",
  ),
  fact(
    "other",
    CA_MISC_DEDUCTION_KEYS.investmentFees,
    0,
    `${ANSWERS}: no investment fees among the deductions (Schedule CA Part II line 21).`,
  ),
];

const californiaAnswers: TaxFactRow[] = [
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    `${ANSWERS}: full_year_health_coverage.`,
  ),
  fact("other", "use_tax.owed_amount", 0, `${ANSWERS}: ca_form540.use_tax.`),
  fact(
    "other",
    CA_EMPLOYEE_CLASSIFICATION_KEYS.classifiedAsEmployee,
    true,
    `${ANSWERS}: reqd_employee_for_ca.`,
  ),
  fact("other", CA_EMPLOYEE_CLASSIFICATION_KEYS.grossIncome, 9800, `${ANSWERS}: add_gross_income.`),
  fact("other", CA_EMPLOYEE_CLASSIFICATION_KEYS.netProfit, 0, `${ANSWERS}: sub_net_profit.`),
  fact("other", CA_EMPLOYEE_CLASSIFICATION_KEYS.netLoss, 11140, `${ANSWERS}: add_net_loss.`),
  fact(
    "other",
    CA_EMPLOYEE_CLASSIFICATION_KEYS.selfEmploymentTaxDeduction,
    0,
    `${ANSWERS}: sub_setax.`,
  ),
  fact(
    "other",
    CA_EMPLOYEE_CLASSIFICATION_KEYS.selfEmployedHealthInsurance,
    0,
    `${ANSWERS}: sub_sehi.`,
  ),
];

export const tcbCa007Facts: TaxFactRow[] = [
  ...identity,
  ...documents,
  ...activities,
  ...dependents,
  ...retirementAnswers,
  ...schedule1Answers,
  ...scheduleAAnswers,
  ...californiaAnswers,
];
