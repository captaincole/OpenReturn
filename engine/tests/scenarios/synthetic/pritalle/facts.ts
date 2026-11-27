/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the facts are the boxes as the two W-2s, the 1099-INT and the
 * 1099-B would print them, and her answers.
 */

import {
  CA_PAYMENT_KEYS,
  CA_RESIDENCY_FACT_KEYS,
  caCaliforniaAmountKey,
  makeInterestFactKey,
  makeTradeFactKey,
  makeW2FactKey,
  type CaResidencyFactValue,
  type InterestFactValue,
  type TradeFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const PRITALLE_USER_ID = "pritalle-integration";
export const PRITALLE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: PRITALLE_USER_ID,
  taxYear: PRITALLE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const PRITALLE = {
  firstName: "Pritalle",
  lastName: "Moradin",
  ssn: "400-00-5401",
  street: "4410 Bluebonnet Lane",
  city: "Austin",
  state: "TX",
  zip: "78745",
};

const address = {
  line1: PRITALLE.street,
  city: PRITALLE.city,
  state: PRITALLE.state,
  zip: PRITALLE.zip,
};
const employee = {
  firstName: PRITALLE.firstName,
  lastName: PRITALLE.lastName,
  ssn: PRITALLE.ssn,
  address,
};

/* January to June 27, while she lived in Sacramento: the California employer. */
const sacramentoW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Delta Orchard Analytics Inc",
  employerEin: "00-0005401",
  employerAddress: { line1: "1200 J Street", city: "Sacramento", state: "CA", zip: "95814" },
  employee,
  box1: 64000,
  box2: 7800,
  box3: 64000,
  box4: 3968,
  box5: 64000,
  box6: 928,
  box15: "CA",
  box16: 64000,
  box17: 2750,
};

/* July to December, in Austin: a Texas employer, no state box. */
const austinW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Hill Country Data Co",
  employerEin: "00-0005402",
  employerAddress: { line1: "600 Congress Avenue", city: "Austin", state: "TX", zip: "78701" },
  employee,
  box1: 52000,
  box2: 5900,
  box3: 52000,
  box4: 3224,
  box5: 52000,
  box6: 754,
};

const savingsInterest: InterestFactValue = {
  payerName: "Golden Bear Credit Union",
  box1: 1400,
};

/* Shares she sold in March, while a California resident. */
const SALE_ID = "sierra-pines-2025-03";
const sierraPinesSale: TradeFactValue = {
  tradeId: SALE_ID,
  description: "SIERRA PINES CORP",
  quantity: 120,
  dateAcquired: "04/02/2019",
  dateSold: "03/11/2025",
  proceeds: 21500,
  costBasis: 9500,
};

/*
 * Part I: she moved out of California on June 30, 2025 to Texas. 181 days in
 * California as a resident and 5 more on a visit in October.
 */
const residency: CaResidencyFactValue = {
  residency: "part_year_resident",
  domicileState: "TX",
  becameNonresident: { state: "TX", date: "06/30/2025" },
  daysInCalifornia: 186,
  ownedCaliforniaProperty: false,
  priorResidency: { begin: "08/15/2016", end: "12/31/2024" },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: PRITALLE_USER_ID, taxYear: PRITALLE_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-26";

export const pritalleFacts: TaxFactRow[] = [
  idFact("name.first", PRITALLE.firstName),
  idFact("name.last", PRITALLE.lastName),
  idFact("ssn", PRITALLE.ssn),
  idFact("dob", "03/14/1988"),
  idFact("address.street", PRITALLE.street),
  idFact("address.city", PRITALLE.city),
  idFact("address.state", PRITALLE.state),
  idFact("address.zip", PRITALLE.zip),
  idFact("occupation", "Data analyst"),
  idFact("phone", "512-555-0154"),
  fact(
    "wages",
    makeW2FactKey("delta-orchard"),
    sacramentoW2,
    "W-2 from Delta Orchard Analytics Inc.",
  ),
  fact("wages", makeW2FactKey("hill-country-data"), austinW2, "W-2 from Hill Country Data Co."),
  fact(
    "investment_income",
    makeInterestFactKey("golden-bear-savings"),
    savingsInterest,
    "1099-INT from Golden Bear Credit Union.",
  ),
  fact(
    "investment_income",
    makeTradeFactKey("sierra-brokerage", SALE_ID),
    sierraPinesSale,
    "1099-B from Sierra Brokerage (covered, basis reported).",
  ),
  fact(
    "health_coverage",
    "health_coverage.full_year_mec",
    true,
    `${VERBAL}: employer coverage all year.`,
  ),
  fact(
    "estimated_payments",
    CA_PAYMENT_KEYS.estimatedTax,
    400,
    `${VERBAL}: one 2025 Form 540-ES payment in April.`,
  ),
  fact(
    "identity",
    CA_RESIDENCY_FACT_KEYS.taxpayer,
    residency,
    `${VERBAL}: the move and the dates.`,
  ),
  /* Column E: what she earned or received while a California resident (Schedule CA (540NR)). */
  fact(
    "state_local_tax",
    caCaliforniaAmountKey("1a"),
    64000,
    `${VERBAL}: all of the Delta Orchard wages, none of the Texas wages.`,
  ),
  fact(
    "state_local_tax",
    caCaliforniaAmountKey("2b"),
    650,
    `${VERBAL}: the interest credited January to June (her monthly statements).`,
  ),
  fact(
    "state_local_tax",
    caCaliforniaAmountKey("7a"),
    12000,
    `${VERBAL}: the March sale, while she lived in Sacramento.`,
  ),
];
