/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the facts are the W-2 boxes and the daily tip record as they would read.
 */

import {
  makeTipsFactKey,
  makeW2FactKey,
  type TipsFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const DELPHINE_USER_ID = "delphine-integration";
export const DELPHINE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-21T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: DELPHINE_USER_ID,
  taxYear: DELPHINE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const DELPHINE = {
  firstName: "Delphine",
  lastName: "Arceneaux",
  ssn: "400-00-4137",
  street: "3815 Juniper Mesa Drive",
  city: "Las Vegas",
  state: "NV",
  zip: "89121",
};

const address = {
  line1: DELPHINE.street,
  city: DELPHINE.city,
  state: DELPHINE.state,
  zip: DELPHINE.zip,
};
const employee = {
  firstName: DELPHINE.firstName,
  lastName: DELPHINE.lastName,
  ssn: DELPHINE.ssn,
  address,
};

/* W-2 from Silver Sage Bistro (made up): $28,000 pay and $9,400 reported tips. */
const silverSageW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Silver Sage Bistro LLC",
  employerEin: "00-0004137",
  employerAddress: { line1: "410 Fremont Row", city: "Las Vegas", state: "NV", zip: "89101" },
  employee,
  box1: 37400,
  box2: 2100,
  box3: 28000,
  box4: 2318.8,
  box5: 37400,
  box6: 542.3,
  box7: 9400,
};

/* Her tip record at Silver Sage: $3,250.40 of cash tips she did not report. */
const silverSageTips: TipsFactValue = {
  employerName: "Silver Sage Bistro LLC",
  employerEin: "00-0004137",
  tipsReceived: 12650.4,
  tipsReported: 9400,
};

/* W-2 from Desert Bloom Catering (made up): $6,200 pay and $1,150 reported tips. */
const desertBloomW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Desert Bloom Catering Inc",
  employerEin: "00-0008137",
  employerAddress: {
    line1: "77 Sunrise Commerce Ct",
    city: "Henderson",
    state: "NV",
    zip: "89014",
  },
  employee,
  box1: 7350,
  box2: 300,
  box3: 6200,
  box4: 455.7,
  box5: 7350,
  box6: 106.58,
  box7: 1150,
};

/*
 * Her tip record at Desert Bloom: $339.75 not reported, of which $52 came in
 * three months under $20 ($18, $19, $15), and $240 of concert tickets (noncash).
 */
const desertBloomTips: TipsFactValue = {
  employerName: "Desert Bloom Catering Inc",
  employerEin: "00-0008137",
  tipsReceived: 1489.75,
  tipsReported: 1150,
  tipsUnder20InAMonth: 52,
  noncashTips: 240,
};

/* W-2 from Copper Canyon Casino (made up): box 8 allocated tips $1,320, no tip record. */
const copperCanyonW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Copper Canyon Casino Resort",
  employerEin: "00-0009137",
  employerAddress: { line1: "1 Canyon Strip Blvd", city: "Las Vegas", state: "NV", zip: "89109" },
  employee,
  box1: 22050,
  box2: 1500,
  box3: 19000,
  box4: 1367.1,
  box5: 22050,
  box6: 319.73,
  box7: 3050,
  box8: 1320,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: DELPHINE_USER_ID, taxYear: DELPHINE_TAX_YEAR, suffix, value });

export const delphineFacts: TaxFactRow[] = [
  idFact("name.first", DELPHINE.firstName),
  idFact("name.last", DELPHINE.lastName),
  idFact("ssn", DELPHINE.ssn),
  idFact("dob", "03/22/1991"),
  idFact("address.street", DELPHINE.street),
  idFact("address.city", DELPHINE.city),
  idFact("address.state", DELPHINE.state),
  idFact("address.zip", DELPHINE.zip),
  idFact("occupation", "Server"),
  idFact("phone", "702-555-0137"),
  fact("wages", makeW2FactKey("silver-sage"), silverSageW2, "W-2 from Silver Sage Bistro."),
  fact("wages", makeTipsFactKey("silver-sage"), silverSageTips, "Daily tip record, Silver Sage."),
  fact("wages", makeW2FactKey("desert-bloom"), desertBloomW2, "W-2 from Desert Bloom Catering."),
  fact(
    "wages",
    makeTipsFactKey("desert-bloom"),
    desertBloomTips,
    "Daily tip record, Desert Bloom.",
  ),
  fact("wages", makeW2FactKey("copper-canyon"), copperCanyonW2, "W-2 from Copper Canyon Casino."),
];
