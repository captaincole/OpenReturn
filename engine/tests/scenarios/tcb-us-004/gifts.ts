/*
 * The 11 noncash gifts of TaxCalcBench ty25-us-004 (README.md), one fact each,
 * in the answers' order (input/remaining_data.json f8283list), which is the
 * order of the key's rows (output.xml IRS8283-0, -1, -2, rows A–D). Numbers and
 * dates copy the answers; the text copies the key, which prints the answers'
 * words in capitals. The property type maps the answers' itemType code
 * (O other, S1 exchange, S2 over the counter, S3 mutual fund, A art,
 * C collectible, QCC conservation, RE real estate, IP intellectual property,
 * E equipment, SO other securities).
 */

import type { NoncashGiftFactValue } from "../../../src/facts/index.js";

export interface TcbGift {
  slug: string;
  gift: NoncashGiftFactValue;
}

export const TCB_US_004_GIFTS: TcbGift[] = [
  {
    slug: "goodwill-clothes",
    gift: {
      donee: {
        name: "GOODWILL",
        street: "1000 LEXINGTON RD",
        city: "CITY",
        state: "FL",
        zip: "32751",
      },
      propertyType: "other",
      description: "CLOTHES",
      contributionDate: "12/31/2025",
      dateAcquired: "VARIOUS",
      howAcquired: "PURCHASED",
      costBasis: 650,
      fairMarketValue: 650,
      valuationMethod: "THRIFT SHOP VALUE",
    },
  },
  {
    slug: "salvation-army-exchange-securities",
    gift: {
      donee: {
        name: "SALVATION ARMY",
        street: "111 TEST",
        city: "CITY",
        state: "NC",
        zip: "28215",
      },
      propertyType: "publicly_traded_security",
      description: "EXCHANGE SECURITIES",
      contributionDate: "11/14/2025",
      dateAcquired: "VARIOUS",
      howAcquired: "PURCHASED",
      costBasis: 800,
      fairMarketValue: 1000,
      valuationMethod: "APPRAISAL",
    },
  },
  {
    slug: "state-rescue-mission-otc-securities",
    gift: {
      donee: {
        name: "STATE RESCUE MISSION",
        street: "1003 16TH AVE",
        city: "CHARLOTTE",
        state: "NC",
        zip: "28215",
      },
      propertyType: "publicly_traded_security",
      description: "OTC SECURITIES",
      contributionDate: "07/19/2025",
      dateAcquired: "12/14/2021",
      howAcquired: "PURCHASED",
      costBasis: 500,
      fairMarketValue: 500,
      valuationMethod: "APPRAISED",
    },
  },
  {
    /* The answers give no date acquired, way acquired or cost. */
    slug: "nonprofit-organization-mutual-fund",
    gift: {
      donee: {
        name: "NONPROFIT ORGANIZATION",
        street: "111 DONOR ST",
        city: "CITY",
        state: "FL",
        zip: "32705",
      },
      propertyType: "publicly_traded_security",
      description: "MUTUAL FUND SECURITIES",
      contributionDate: "12/31/2025",
      fairMarketValue: 300,
      valuationMethod: "APPRAISED",
    },
  },
  {
    slug: "nonprofit-charity-painting",
    gift: {
      donee: {
        name: "NONPROFIT CHARITY",
        street: "111 TEST ST",
        city: "CITY",
        state: "NC",
        zip: "28234",
      },
      propertyType: "art",
      description: "PAINTING",
      contributionDate: "12/31/2025",
      dateAcquired: "VARIOUS",
      howAcquired: "INHERITIE", // as the answers and the key spell it
      costBasis: 1500,
      fairMarketValue: 1500,
      valuationMethod: "APPRAISED",
    },
  },
  {
    slug: "name-collectible",
    gift: {
      donee: { name: "NAME", street: "STREET", city: "CITY", state: "AL", zip: "36132" },
      propertyType: "collectible",
      description: "COLLECTIBLE",
      contributionDate: "12/01/2025",
      howAcquired: "PURCHASED",
      fairMarketValue: 100,
      valuationMethod: "BOOK VALUE",
    },
  },
  {
    slug: "farm-community-conservation",
    gift: {
      donee: { name: "FARM COMMUNITY", street: "ADDRESS", city: "CITY", state: "TX", zip: "75001" },
      propertyType: "conservation",
      description: "QUAL CONSERVATION",
      contributionDate: "03/08/2025",
      howAcquired: "GIFTED",
      costBasis: 0,
      fairMarketValue: 250,
      valuationMethod: "BOOK VALUE",
    },
  },
  {
    slug: "other-real-estate",
    gift: {
      donee: {
        name: "OTHER REAL ESTATE",
        street: "STREET",
        city: "CITY",
        state: "SC",
        zip: "29020",
      },
      propertyType: "real_estate",
      description: "OTHER REAL ESTATE",
      contributionDate: "07/19/2025",
      howAcquired: "PURCHASED",
      fairMarketValue: 499,
      valuationMethod: "APPRAISED",
    },
  },
  {
    slug: "name-intellectual-property",
    gift: {
      donee: { name: "NAME", street: "ADDRESS", city: "CITY", state: "GA", zip: "30303" },
      propertyType: "intellectual_property",
      description: "INTELLECTUAL",
      contributionDate: "07/01/2025",
      fairMarketValue: 100,
      valuationMethod: "BOOK",
    },
  },
  {
    slug: "goodwill-equipment",
    gift: {
      donee: {
        name: "GOODWILL",
        street: "11 DONATION RD",
        city: "CITY",
        state: "FL",
        zip: "32771",
      },
      propertyType: "equipment",
      description: "EQUIPMENT",
      contributionDate: "01/20/2025",
      dateAcquired: "VARIOUS",
      howAcquired: "PURCHASED",
      fairMarketValue: 100,
      valuationMethod: "THRIFT VALUE",
    },
  },
  {
    slug: "test-other-securities",
    gift: {
      donee: { name: "TEST", street: "STREET", city: "CITY", state: "DE", zip: "19701" },
      propertyType: "other_security",
      description: "OTHER SECURITIES",
      contributionDate: "12/31/2025",
      howAcquired: "PURCHASED",
      fairMarketValue: 1,
      valuationMethod: "BOOK",
    },
  },
];
