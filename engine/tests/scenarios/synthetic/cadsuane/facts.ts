/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the facts are the boxes as the W-2 and the two Schedules K-1
 * (Form 1065) would print them, and her answers.
 */

import {
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  makeW2FactKey,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const CADSUANE_USER_ID = "cadsuane-integration";
export const CADSUANE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-23T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: CADSUANE_USER_ID,
  taxYear: CADSUANE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const CADSUANE = {
  taxpayer: { firstName: "Cadsuane", lastName: "Melaidhrin", ssn: "400-00-4201" },
  street: "7 Harbor Point Road",
  city: "Tampa",
  state: "FL",
  zip: "33602",
};

const address = {
  line1: CADSUANE.street,
  city: CADSUANE.city,
  state: CADSUANE.state,
  zip: CADSUANE.zip,
};

const cadsuaneW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "White Tower Consulting Group",
  employerEin: "00-0004201",
  employerAddress: address,
  employee: { ...CADSUANE.taxpayer, address },
  box1: 180000,
  box2: 32000,
  box3: 176100,
  box4: 10918.2,
  box5: 180000,
  box6: 2610,
};

const BOATWORKS_ID = "tar-valon-boatworks";
const APARTMENTS_ID = "caemlyn-apartments";

/*
 * A boatyard she invests in as a limited partner: a business loss, and the
 * section 199A statement that gives the same loss as QBI. No debt.
 */
const boatworksK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Tar Valon Boatworks LP",
  entityEin: "00-0002065",
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "limited",
  profitPercent: 5,
  lossPercent: 5,
  capitalPercent: 5,
  boxes: [
    { box: "1", amount: -30000 },
    { box: "20", code: "Z" },
  ],
  section199A: {
    businessName: "Tar Valon Boatworks LP",
    qualifiedBusinessIncome: -30000,
    w2Wages: 0,
    qualifiedPropertyUbia: 0,
    specifiedService: false,
  },
};

/*
 * An apartment building she owns a share of as a limited partner: rental
 * income, a cash distribution, and her share of the building's mortgage
 * (qualified nonrecourse financing), which went down during the year.
 */
const apartmentsK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Caemlyn Apartments LP",
  entityEin: "00-0003065",
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "limited",
  profitPercent: 10,
  lossPercent: 10,
  capitalPercent: 10,
  liabilitiesAtStart: { qualifiedNonrecourseFinancing: 200000 },
  liabilitiesAtEnd: { qualifiedNonrecourseFinancing: 190000 },
  boxes: [
    { box: "2", amount: 12000 },
    { box: "19", code: "A", amount: 8000 },
  ],
};

/* Her answers: she works in neither; all of her money in the boatyard is at risk; her 2024 worksheets' line 18. */
const boatworksHolding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: false,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 50000,
};

const apartmentsHolding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: false,
  realEstateProfessional: false,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 60000,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: CADSUANE_USER_ID, taxYear: CADSUANE_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-23";

export const cadsuaneFacts: TaxFactRow[] = [
  idFact("name.first", CADSUANE.taxpayer.firstName),
  idFact("name.last", CADSUANE.taxpayer.lastName),
  idFact("ssn", CADSUANE.taxpayer.ssn),
  idFact("dob", "09/03/1966"),
  idFact("address.street", CADSUANE.street),
  idFact("address.city", CADSUANE.city),
  idFact("address.state", CADSUANE.state),
  idFact("address.zip", CADSUANE.zip),
  idFact("occupation", "Consultant"),
  idFact("phone", "813-555-0142"),
  fact(
    "wages",
    makeW2FactKey("white-tower-consulting"),
    cadsuaneW2,
    "W-2 from White Tower Consulting Group.",
  ),
  fact(
    "k1",
    makePartnershipK1FactKey(BOATWORKS_ID),
    boatworksK1,
    "Schedule K-1 (Form 1065) from Tar Valon Boatworks LP.",
  ),
  fact(
    "k1",
    makeK1HoldingFactKey(BOATWORKS_ID),
    boatworksHolding,
    `${VERBAL}: basis from her 2024 partner's basis worksheet.`,
  ),
  fact(
    "k1",
    makePartnershipK1FactKey(APARTMENTS_ID),
    apartmentsK1,
    "Schedule K-1 (Form 1065) from Caemlyn Apartments LP.",
  ),
  fact(
    "k1",
    makeK1HoldingFactKey(APARTMENTS_ID),
    apartmentsHolding,
    `${VERBAL}: basis from her 2024 partner's basis worksheet.`,
  ),
];
