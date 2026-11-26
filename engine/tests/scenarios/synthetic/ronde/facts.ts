/*
 * A made-up married couple (README.md): every name and amount is invented. The
 * Schedule K-1 (Form 1065) is a made PDF in docs/ (generate-docs.ts); the W-2s
 * and the 1099-DIV have none: their facts are the boxes as they would print.
 * The prior year unallowed qualified electric vehicle credit is the couple's
 * answer from last year's Form 8582-CR: the product does not read last year's
 * return yet (#79).
 */

import {
  SPOUSE_KEYS,
  makeDependentFactKey,
  makeDividendFactKey,
  makeElectricVehiclePassiveCreditFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  makeW2FactKey,
  type DependentFactValue,
  type DividendFactValue,
  type ElectricVehiclePassiveCreditFactValue,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const RONDE_USER_ID = "ronde-synthetic";
export const RONDE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const MADE_UP = "synthetic (made up for this scenario)";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: RONDE_USER_ID,
  taxYear: RONDE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const RONDE = {
  taxpayer: { firstName: "Ronde", lastName: "Tallowmere", ssn: "400-00-8834" },
  spouse: { firstName: "Ilse", lastName: "Tallowmere", ssn: "400-00-8835" },
  street: "618 Juniper Hollow Road",
  city: "Round Rock",
  state: "TX",
  zip: "78664",
};

const HOME = { line1: RONDE.street, city: RONDE.city, state: RONDE.state, zip: RONDE.zip };

// Ronde's W-2 as a hospital pharmacist (made up).
const rondeW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Brushy Creek Medical Center",
  employerEin: "00-0088341",
  employerAddress: { line1: "2400 Medical Pkwy", city: "Round Rock", state: "TX", zip: "78665" },
  employee: { ...RONDE.taxpayer, address: HOME },
  box1: 132000,
  box2: 15600,
  box3: 132000,
  box4: 8184,
  box5: 132000,
  box6: 1914,
};

// Ilse's W-2 as a school librarian (made up).
const ilseW2: W2FactValue = {
  owner: "spouse",
  employerName: "Round Rock Learning Cooperative",
  employerEin: "00-0088342",
  employerAddress: { line1: "1311 Round Rock Ave", city: "Round Rock", state: "TX", zip: "78681" },
  employee: { ...RONDE.spouse, address: HOME },
  box1: 61000,
  box2: 6400,
  box3: 61000,
  box4: 3782,
  box5: 61000,
  box6: 884.5,
};

/* A world stock index fund: box 7 foreign tax under $600 joint, so the election applies (Schedule 3 line 1). */
const fundDividends: DividendFactValue = {
  payerName: "Pedernales World Index Fund",
  payerTin: "00-0088343",
  box1a: 1450,
  box1b: 1200,
  box7: 88,
};

/* Their son, 7: a qualifying child for the child tax credit (Form 1040 line 19). */
const son: DependentFactValue = {
  firstName: "Tobin",
  lastName: "Tallowmere",
  ssn: "400-00-8836",
  relationship: "Son",
  dob: "03/09/2018",
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
};

export const DELIVERY_ID = "harbor-electric-delivery";
export const DELIVERY_EIN = "00-0088344";
export const DELIVERY_NAME = "Harbor Electric Delivery LLC";

/*
 * A delivery business Ronde invested in and does not work in: a passive trade
 * or business. It ran a fleet of electric vans placed in service in 2005;
 * its losses kept the vans' qualified electric vehicle credit unallowed until
 * 2025, its first year of income. Box 1 only; no section 199A statement.
 */
export const deliveryK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: DELIVERY_NAME,
  entityEin: DELIVERY_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "limited",
  profitPercent: 8,
  lossPercent: 8,
  capitalPercent: 8,
  boxes: [{ box: "1", amount: 14000 }],
};

const deliveryHolding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: false,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 52000,
};

/* Last year's unallowed credit: 2024 Form 8582-CR line 5 less line 37 (its only passive credit). */
export const VAN_CREDIT: ElectricVehiclePassiveCreditFactValue = {
  amount: 2400,
  activity: { name: DELIVERY_NAME, rentalRealEstate: false },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: RONDE_USER_ID, taxYear: RONDE_TAX_YEAR, suffix, value });

const IDENTITY: TaxFactRow[] = [
  idFact("name.first", RONDE.taxpayer.firstName),
  idFact("name.last", RONDE.taxpayer.lastName),
  idFact("ssn", RONDE.taxpayer.ssn),
  idFact("dob", "10/21/1979"),
  idFact("address.street", RONDE.street),
  idFact("address.city", RONDE.city),
  idFact("address.state", RONDE.state),
  idFact("address.zip", RONDE.zip),
  idFact("occupation", "Pharmacist"),
  idFact("phone", "512-555-0134"),
  fact("identity", SPOUSE_KEYS.firstName, RONDE.spouse.firstName, "Stated by Ronde."),
  fact("identity", SPOUSE_KEYS.lastName, RONDE.spouse.lastName, "Stated by Ronde."),
  fact("identity", SPOUSE_KEYS.occupation, "Librarian", "Stated by Ronde."),
  fact("identity", SPOUSE_KEYS.ssn, RONDE.spouse.ssn, "Ilse's W-2, box a."),
  fact("identity", SPOUSE_KEYS.dob, "06/14/1981", "Stated by Ilse."),
];

const VERBAL = "Verbal, 2026-11-26";

export const rondeFacts: TaxFactRow[] = [
  ...IDENTITY,
  fact("wages", makeW2FactKey("brushy-creek-medical"), rondeW2, `W-2, ${MADE_UP}.`),
  fact("wages", makeW2FactKey("round-rock-learning"), ilseW2, `W-2, ${MADE_UP}.`),
  fact(
    "investment_income",
    makeDividendFactKey("pedernales-world-index"),
    fundDividends,
    `1099-DIV from Pedernales World Index Fund, ${MADE_UP}.`,
  ),
  fact("dependents", makeDependentFactKey("tobin-tallowmere"), son, MADE_UP),
  fact(
    "k1",
    makePartnershipK1FactKey(DELIVERY_ID),
    deliveryK1,
    "Schedule K-1 (Form 1065) (docs/01-schedule-k1-harbor-electric-delivery.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(DELIVERY_ID), deliveryHolding, VERBAL),
  fact(
    "other",
    makeElectricVehiclePassiveCreditFactKey("harbor-electric-vans"),
    VAN_CREDIT,
    "2024 Form 8582-CR line 5 less line 37, from last year's return (stated; #79).",
  ),
];
