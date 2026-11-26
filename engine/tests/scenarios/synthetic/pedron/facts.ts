/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the W-2 fact holds the boxes as the form would print them, and the
 * building fact the amounts of the owner's own earlier Forms 8586, 8609 and
 * 8609-A.
 */

import {
  makeLowIncomeHousingRecaptureFactKey,
  makeW2FactKey,
  type OwnLowIncomeHousingRecapture,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const PEDRON_USER_ID = "pedron-integration";
export const PEDRON_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: PEDRON_USER_ID,
  taxYear: PEDRON_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const PEDRON = {
  firstName: "Pedron",
  lastName: "Ashgrove",
  ssn: "400-00-8611",
  street: "88 Cottonwood Ridge Court",
  city: "Reno",
  state: "NV",
  zip: "89511",
};

const address = { line1: PEDRON.street, city: PEDRON.city, state: PEDRON.state, zip: PEDRON.zip };

// W-2 from a made-up engineering firm.
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Sierra Meadow Engineering LLC",
  employerEin: "00-0008611",
  employerAddress: { line1: "1200 Kietzke Lane", city: "Reno", state: "NV", zip: "89502" },
  employee: { firstName: PEDRON.firstName, lastName: PEDRON.lastName, ssn: PEDRON.ssn, address },
  box1: 185000,
  box2: 36000,
  box3: 176100,
  box4: 10918.2,
  box5: 185000,
  box6: 2682.5,
};

/*
 * A 24-unit building Pedron owns directly (made up), placed in service in June
 * 2018; 2018 is the first credit year, so 2025 is year 8. The 2021 Form 8609-A
 * completed line 7: an addition to qualified basis that year. In 2025 tenants
 * who were not income-qualified moved into four units: the qualified basis fell
 * below its first-year amount. A smaller decrease in 2023 was recaptured then.
 */
const building: OwnLowIncomeHousingRecapture = {
  kind: "own",
  building: {
    address: "1420 Juniper Row, Reno, NV 89502",
    buildingIdentificationNumber: "NV-18-00412",
    placedInServiceDate: "2018-06-15",
    taxExemptBonds: {
      issuerName: "Washoe Valley Housing Finance Authority",
      issueDate: "2017-11-01",
      issueName: "Multifamily Housing Revenue Bonds, Series 2017A",
      cusipNumber: "000861AB1",
    },
  },
  firstCreditYear: 2018,
  priorYears: [
    { taxYear: 2018, credit: 9000 },
    { taxYear: 2019, credit: 12000 },
    { taxYear: 2020, credit: 12000 },
    {
      taxYear: 2021,
      credit: 13400,
      additions: { line10: 700, line11: 300, line14Step1Decimal: 0.25, line15: 12, line16: 9 },
    },
    { taxYear: 2022, credit: 12000 },
    { taxYear: 2023, credit: 12000 },
    { taxYear: 2024, credit: 12000 },
  ],
  basisChange: {
    kind: "decrease",
    firstYearQualifiedBasis: 2400000,
    priorYearEndQualifiedBasis: 2520000,
    yearEndQualifiedBasis: 1980000,
  },
  acceleratedPortionRecapturedEarlier: 400,
  unusedCredits: 3000,
  unusedCreditsFromAdditions: 200,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: PEDRON_USER_ID, taxYear: PEDRON_TAX_YEAR, suffix, value });

export const pedronFacts: TaxFactRow[] = [
  idFact("name.first", PEDRON.firstName),
  idFact("name.last", PEDRON.lastName),
  idFact("ssn", PEDRON.ssn),
  idFact("dob", "02/09/1979"),
  idFact("address.street", PEDRON.street),
  idFact("address.city", PEDRON.city),
  idFact("address.state", PEDRON.state),
  idFact("address.zip", PEDRON.zip),
  idFact("occupation", "Civil engineer"),
  idFact("phone", "775-555-0186"),
  fact("wages", makeW2FactKey("sierra-meadow"), w2, "W-2 from Sierra Meadow Engineering."),
  fact(
    "rental",
    makeLowIncomeHousingRecaptureFactKey("juniper-row"),
    building,
    "Pedron's Forms 8586 (2018–2024), Form 8609, Forms 8609-A, Form 3800 carryforward, and his 2023 Form 8611.",
  ),
];
