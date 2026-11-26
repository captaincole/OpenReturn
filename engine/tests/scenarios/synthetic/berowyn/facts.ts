/*
 * A made-up California resident (README.md): every name and amount is
 * invented. A W-2, three Forms 1099-C (docs/), the answers she states about
 * each canceled debt, her Insolvency Worksheet totals and her property basis.
 */

import {
  DEBT_RELIEF_KEYS,
  makeCanceledDebtFactKey,
  makeForm1099CFactKey,
  makeW2FactKey,
  type CanceledDebtFactValue,
  type Form1099CFactValue,
  type InsolvencyFactValue,
  type TaxAttributesFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const BEROWYN_USER_ID = "berowyn-integration";
export const BEROWYN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const VERBAL = "Verbal, 2026-11-26";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: BEROWYN_USER_ID,
  taxYear: BEROWYN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const BEROWYN = {
  firstName: "Berowyn",
  lastName: "Halloway",
  ssn: "400-00-0983",
  street: "4712 Tamarack Way",
  city: "Sacramento",
  state: "CA",
  zip: "95823",
};

const HOME = { line1: BEROWYN.street, city: BEROWYN.city, state: BEROWYN.state, zip: BEROWYN.zip };

const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Delta River Water District",
  employerEin: "00-0000985",
  employerAddress: { line1: "300 Levee Road", city: "Sacramento", state: "CA", zip: "95814" },
  employee: {
    firstName: BEROWYN.firstName,
    lastName: BEROWYN.lastName,
    ssn: BEROWYN.ssn,
    address: HOME,
  },
  box1: 72000,
  box2: 7200,
  box3: 72000,
  box4: 4464,
  box5: 72000,
  box6: 1044,
  box14: [{ label: "CA SDI", amount: 864 }],
  box15: "CA",
  box16: 72000,
  box17: 2900,
};

/* The three Forms 1099-C, as printed (docs/01 to 03). */
export const FORM_1099C: Record<string, { key: string; value: Form1099CFactValue }> = {
  card: {
    key: makeForm1099CFactKey("golden-bear-bank", "2025-001"),
    value: {
      creditorName: "Golden Bear Bank",
      creditorTin: "00-0000986",
      box1: "2025-02-10",
      box2: 6500,
      box4: "Credit card account settled for less than the balance",
      box5: true,
      box6: "F",
    },
  },
  home: {
    key: makeForm1099CFactKey("sierra-gold-mortgage", "2025-001"),
    value: {
      creditorName: "Sierra Gold Mortgage Co",
      creditorTin: "00-0000987",
      box1: "2025-08-20",
      box2: 25000,
      box4: "Loan modification, principal reduction, 4712 Tamarack Way",
      box5: true,
      box6: "F",
    },
  },
  car: {
    key: makeForm1099CFactKey("delta-auto-finance", "2025-001"),
    value: {
      creditorName: "Delta Auto Finance Inc",
      creditorTin: "00-0000988",
      box1: "2025-12-05",
      box2: 3800,
      box4: "Auto loan deficiency after repossession and sale",
      box5: true,
      box6: "G",
      box7: 11200,
    },
  },
};

const cardDebt: CanceledDebtFactValue = {
  form1099CKey: FORM_1099C.card.key,
  kind: "personal",
  title11Case: false,
  insolventBefore: false,
};

const homeDebt: CanceledDebtFactValue = {
  form1099CKey: FORM_1099C.home.key,
  kind: "principal_residence",
  title11Case: false,
  insolventBefore: false,
  principalResidence: {
    loanBalance: 470000,
    qualifiedPart: 470000,
    keepsHome: true,
    homeBasis: 520000,
  },
};

const carDebt: CanceledDebtFactValue = {
  form1099CKey: FORM_1099C.car.key,
  kind: "personal",
  title11Case: false,
  insolventBefore: true,
};

// Insolvency Worksheet, immediately before the car loan was canceled on December 5, 2025.
const insolvency: InsolvencyFactValue = { totalLiabilities: 512000, totalAssetsValue: 509100 };

// Only basis of personal-use property: her home ($520,000) and household goods ($8,000).
const attributes: TaxAttributesFactValue = {
  otherPropertyBasis: 528000,
  moneyAfterDischarge: 2600,
  liabilitiesAfterDischarge: 508200,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: BEROWYN_USER_ID, taxYear: BEROWYN_TAX_YEAR, suffix, value });

export const berowynFacts: TaxFactRow[] = [
  idFact("name.first", BEROWYN.firstName),
  idFact("name.last", BEROWYN.lastName),
  idFact("ssn", BEROWYN.ssn),
  idFact("dob", "04/14/1984"),
  idFact("address.street", BEROWYN.street),
  idFact("address.city", BEROWYN.city),
  idFact("address.state", BEROWYN.state),
  idFact("address.zip", BEROWYN.zip),
  idFact("address.county", "Sacramento"),
  idFact("occupation", "Water systems operator"),
  idFact("phone", "916-555-0983"),
  fact("wages", makeW2FactKey("delta-river-water"), w2, "W-2 from Delta River Water District."),
  fact(
    "other",
    FORM_1099C.card.key,
    FORM_1099C.card.value,
    "1099-C (docs/01-golden-bear-bank-1099c.pdf).",
  ),
  fact(
    "other",
    FORM_1099C.home.key,
    FORM_1099C.home.value,
    "1099-C (docs/02-sierra-gold-mortgage-1099c.pdf).",
  ),
  fact(
    "other",
    FORM_1099C.car.key,
    FORM_1099C.car.value,
    "1099-C (docs/03-delta-auto-finance-1099c.pdf).",
  ),
  fact(
    "other",
    makeCanceledDebtFactKey("golden-bear-card"),
    cardDebt,
    `${VERBAL}: a personal credit card; she was not insolvent in February.`,
  ),
  fact(
    "other",
    makeCanceledDebtFactKey("sierra-gold-home"),
    homeDebt,
    `${VERBAL}: the loan bought her main home in 2021; she still lives there; basis from her closing statement.`,
  ),
  fact(
    "other",
    makeCanceledDebtFactKey("delta-auto"),
    carDebt,
    `${VERBAL}: her personal car; she was insolvent just before the deficiency was canceled.`,
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
    `${VERBAL}: no carryovers; personal-use property basis, cash and liabilities after December 5.`,
  ),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    `${VERBAL}: employer plan all year.`,
  ),
  fact("use_tax", "use_tax.owed_amount", 0, `${VERBAL}: no out-of-state purchases.`),
];
