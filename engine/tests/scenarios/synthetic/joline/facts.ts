/*
 * A made-up taxpayer (README.md): every name and amount is invented. The W-2
 * has no PDF. The installment sale facts come from the sales contracts, which
 * have no information return the engine reads.
 */

import {
  makeInstallmentSaleFactKey,
  makeW2FactKey,
  type InstallmentSaleFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const JOLINE_USER_ID = "joline-synthetic";
export const JOLINE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: JOLINE_USER_ID,
  taxYear: JOLINE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const JOLINE = {
  firstName: "Joline",
  lastName: "Trevane",
  ssn: "400-00-3805",
  street: "418 Larkspur Court",
  city: "Sacramento",
  state: "CA",
  zip: "95818",
};

const address = { line1: JOLINE.street, city: JOLINE.city, state: JOLINE.state, zip: JOLINE.zip };

// W-2 from a made-up Sacramento employer.
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Capitol Valley Water Agency",
  employerEin: "00-0003805",
  employerAddress: { line1: "1200 River Bend Way", city: "Sacramento", state: "CA", zip: "95814" },
  employee: { firstName: JOLINE.firstName, lastName: JOLINE.lastName, ssn: JOLINE.ssn, address },
  box1: 88000,
  box2: 9500,
  box3: 88000,
  box4: 5456,
  box5: 88000,
  box6: 1276,
  box14: [{ label: "CA SDI", amount: 1056 }],
  box15: "CA",
  box16: 88000,
  box17: 3600,
};

/*
 * Her main home, sold in June 2025 with seller financing. The buyer took over
 * her mortgage, which was more than her installment sale basis (lines 17 and
 * 20). Federal and California amounts are the same.
 */
export const alderHome: InstallmentSaleFactValue = {
  description: "Main home, 27 Alder Street, Sacramento CA",
  propertyCode: 2,
  dateAcquired: "2011-06-01",
  dateSold: "2025-06-30",
  use: "capital_asset",
  sellingPriceDeterminable: true,
  sellingPrice: 900000,
  liabilitiesAssumed: 450000,
  costOrOtherBasis: 340000,
  expensesOfSale: 50000,
  excludedGain: 250000,
  paymentsThisYear: 150000,
};

/*
 * A vacant lot sold in March 2025 to her brother, who resold it in November
 * 2025 (Part III). A California credit reduced her California basis by $10,000
 * (ca-540-sched-d-inst-2025::sec::line-1::b04), so her California gain is larger.
 */
export const foothillLot: InstallmentSaleFactValue = {
  description: "Vacant lot, parcel 14, Foothill Road, Placerville CA",
  propertyCode: 4,
  dateAcquired: "2012-05-10",
  dateSold: "2025-03-14",
  use: "capital_asset",
  sellingPriceDeterminable: true,
  sellingPrice: 300000,
  costOrOtherBasis: 100000,
  expensesOfSale: 6000,
  paymentsThisYear: 60000,
  relatedParty: {
    name: "Darvin Trevane",
    address: "55 Quarry Lane, Auburn CA 95603",
    identifyingNumber: "400-00-3806",
    resoldThisYear: true,
    secondDisposition: { date: "2025-11-20", amountRealized: 340000 },
  },
  california: { costOrOtherBasis: 90000 },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: JOLINE_USER_ID, taxYear: JOLINE_TAX_YEAR, suffix, value });

export const jolineFacts: TaxFactRow[] = [
  idFact("name.first", JOLINE.firstName),
  idFact("name.last", JOLINE.lastName),
  idFact("ssn", JOLINE.ssn),
  idFact("dob", "02/17/1971"),
  idFact("address.street", JOLINE.street),
  idFact("address.city", JOLINE.city),
  idFact("address.state", JOLINE.state),
  idFact("address.zip", JOLINE.zip),
  idFact("occupation", "Hydrologist"),
  idFact("phone", "916-555-0138"),
  idFact("address.county", "Sacramento"),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
  fact("wages", makeW2FactKey("capitol-valley-water"), w2, "W-2 from Capitol Valley Water Agency."),
  // The lot first: its form is the first copy, which the expected values check line by line.
  fact(
    "capital_gains",
    makeInstallmentSaleFactKey("foothill-lot"),
    foothillLot,
    "Sales contract of March 2025; the brother's resale, verbal; California basis from her California records.",
  ),
  fact(
    "capital_gains",
    makeInstallmentSaleFactKey("alder-street-home"),
    alderHome,
    "Sales contract and closing statement of June 2025; excluded gain from the Pub. 523 worksheet, verbal.",
  ),
];
