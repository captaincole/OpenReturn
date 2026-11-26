/*
 * A made-up farmer in Texas (README.md): every name and amount is invented.
 * Three Forms 1099-C (docs/), the answers she states about each canceled debt,
 * her Insolvency Worksheet totals and the tax attributes left after her 2025
 * tax, from her records.
 */

import {
  CAPITAL_LOSS_CARRYOVER_KEYS,
  DEBT_RELIEF_KEYS,
  makeCanceledDebtFactKey,
  makeFarmFactKey,
  makeForm1099CFactKey,
  type CanceledDebtFactValue,
  type FarmFactValue,
  type Form1099CFactValue,
  type InsolvencyFactValue,
  type TaxAttributesFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const AILIL_USER_ID = "ailil-integration";
export const AILIL_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const VERBAL = "Verbal, 2026-11-26";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: AILIL_USER_ID,
  taxYear: AILIL_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const AILIL = {
  firstName: "Ailil",
  lastName: "Corvane",
  ssn: "400-00-0982",
  street: "2210 County Road 18",
  city: "Hereford",
  state: "TX",
  zip: "79045",
};

export const FARM_ID = "corvane-section-9";

/* Her wheat and grain sorghum farm (cash method, material participation). */
const farm: FarmFactValue = {
  owner: "taxpayer",
  activity: "Wheat and grain sorghum",
  code: "111150",
  accountingMethod: "cash",
  materiallyParticipated: true,
  paymentsRequire1099: false,
  productSales: 96000,
  expenses: {
    depreciation: 11000,
    feed: 18000,
    fertilizersAndLime: 9500,
    gasolineFuelAndOil: 6200,
    insurance: 3100,
    otherInterest: 3400,
    repairs: 4300,
    seedsAndPlants: 7800,
    taxes: 2600,
    utilities: 1900,
  },
  newDepreciableProperty: false,
};

/* The three Forms 1099-C, as printed (docs/01 to 03). */
export const FORM_1099C: Record<string, { key: string; value: Form1099CFactValue }> = {
  card: {
    key: makeForm1099CFactKey("lone-star-card", "2025-001"),
    value: {
      creditorName: "Lone Star Card Services NA",
      creditorTin: "00-0000982",
      box1: "2025-03-18",
      box2: 30000,
      box3: 1840,
      box4: "Credit card account, charged off and settled",
      box5: true,
      box6: "G",
    },
  },
  home: {
    key: makeForm1099CFactKey("caprock-home-lending", "2025-001"),
    value: {
      creditorName: "Caprock Home Lending LLC",
      creditorTin: "00-0000983",
      box1: "2025-06-12",
      box2: 40000,
      box4: "Principal reduction, first mortgage on 2210 County Road 18",
      box5: true,
      box6: "F",
    },
  },
  farm: {
    key: makeForm1099CFactKey("panhandle-farm-credit", "2025-001"),
    value: {
      creditorName: "Panhandle Farm Credit ACA",
      creditorTin: "00-0000984",
      box1: "2025-10-07",
      box2: 48000,
      box4: "Farm operating line of credit, restructured",
      box5: true,
      box6: "F",
    },
  },
};

const cardDebt: CanceledDebtFactValue = {
  form1099CKey: FORM_1099C.card.key,
  kind: "personal",
  title11Case: false,
  insolventBefore: true,
};

const homeDebt: CanceledDebtFactValue = {
  form1099CKey: FORM_1099C.home.key,
  kind: "principal_residence",
  title11Case: false,
  insolventBefore: false,
  principalResidence: {
    loanBalance: 260000,
    qualifiedPart: 260000,
    keepsHome: true,
    homeBasis: 210000,
  },
};

const farmDebt: CanceledDebtFactValue = {
  form1099CKey: FORM_1099C.farm.key,
  kind: "farm",
  title11Case: false,
  insolventBefore: false,
};

// Insolvency Worksheet, immediately before the card was settled on March 18, 2025.
const insolvency: InsolvencyFactValue = { totalLiabilities: 405000, totalAssetsValue: 390000 };

const attributes: TaxAttributesFactValue = {
  generalBusinessCredit: 1500,
  minimumTaxCredit: 1000,
  netCapitalLoss: 5000,
  passiveActivityLoss: 6000,
  passiveActivityCredit: 400,
  foreignTaxCredit: 800,
  depreciableBasis: 20000,
  realPropertyForSaleBasis: 6000,
  otherPropertyBasis: 290000,
  farmLandBasis: 12000,
  otherQualifiedPropertyBasis: 4000,
  moneyAfterDischarge: 3500,
  liabilitiesAfterDischarge: 375000,
  electedDepreciableBasisReduction: 4000,
  treatRealPropertyForSaleAsDepreciable: true,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: AILIL_USER_ID, taxYear: AILIL_TAX_YEAR, suffix, value });

export const aililFacts: TaxFactRow[] = [
  idFact("name.first", AILIL.firstName),
  idFact("name.last", AILIL.lastName),
  idFact("ssn", AILIL.ssn),
  idFact("dob", "09/02/1977"),
  idFact("address.street", AILIL.street),
  idFact("address.city", AILIL.city),
  idFact("address.state", AILIL.state),
  idFact("address.zip", AILIL.zip),
  idFact("occupation", "Farmer"),
  idFact("phone", "806-555-0982"),
  fact("self_employment", makeFarmFactKey(FARM_ID), farm, `${VERBAL}: the farm's books.`),
  fact(
    "capital_gains",
    CAPITAL_LOSS_CARRYOVER_KEYS.longTerm,
    8000,
    `${VERBAL}: 2024 Capital Loss Carryover Worksheet line 13, from stock sold in 2023.`,
  ),
  fact(
    "other",
    FORM_1099C.card.key,
    FORM_1099C.card.value,
    "1099-C (docs/01-lone-star-card-1099c.pdf).",
  ),
  fact(
    "other",
    FORM_1099C.home.key,
    FORM_1099C.home.value,
    "1099-C (docs/02-caprock-home-lending-1099c.pdf).",
  ),
  fact(
    "other",
    FORM_1099C.farm.key,
    FORM_1099C.farm.value,
    "1099-C (docs/03-panhandle-farm-credit-1099c.pdf).",
  ),
  fact(
    "other",
    makeCanceledDebtFactKey("lone-star-card"),
    cardDebt,
    `${VERBAL}: a personal credit card; she was insolvent just before it was settled.`,
  ),
  fact(
    "other",
    makeCanceledDebtFactKey("caprock-home"),
    homeDebt,
    `${VERBAL}: the loan bought her main home; she still lives there; basis from her closing statement.`,
  ),
  fact(
    "other",
    makeCanceledDebtFactKey("panhandle-farm"),
    farmDebt,
    `${VERBAL}: borrowed for the farm; farming was over 50% of her 2022–2024 gross receipts; solvent in October.`,
  ),
  fact(
    "other",
    DEBT_RELIEF_KEYS.insolvency,
    insolvency,
    `${VERBAL}: Insolvency Worksheet lines 15 and 37.`,
  ),
  fact(
    "other",
    DEBT_RELIEF_KEYS.taxAttributes,
    attributes,
    `${VERBAL}: carryovers and bases from her records, after the 2025 tax; elects line 5 ($4,000) and line 3.`,
  ),
];
