/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the W-2 fact holds the boxes as the form would print them, and
 * the treaty position is the taxpayer's own answers.
 */

import {
  OTHER_INCOME_KEYS,
  makeTreatyPositionFactKey,
  makeW2FactKey,
  type TreatyPositionFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const IRELLA_USER_ID = "irella-synthetic";
export const IRELLA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const VERBAL = "Verbal, 2026-11-26";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: IRELLA_USER_ID,
  taxYear: IRELLA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const IRELLA = {
  firstName: "Irella",
  lastName: "Wenlock",
  ssn: "400-00-8833",
  street: "4417 Bluebonnet Ridge Dr",
  apt: "Apt 12",
  city: "Austin",
  state: "TX",
  zip: "78745",
};

const address = { line1: IRELLA.street, city: IRELLA.city, state: IRELLA.state, zip: IRELLA.zip };

/* The treaty exemption: up to $5,000 a year of a student's wages (made-up position, README.md). */
export const IRELLA_EXEMPT_WAGES = 5000;

/*
 * W-2 from a made-up university: her teaching assistant pay. Box 1 holds all
 * of it, the exempt part included; the student exception keeps it out of
 * social security and Medicare wages, so boxes 3 to 6 are blank.
 */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Prairie Crest State University",
  employerEin: "00-0008833",
  employerAddress: { line1: "1200 Campus Loop", city: "Austin", state: "TX", zip: "78712" },
  employee: { firstName: IRELLA.firstName, lastName: IRELLA.lastName, ssn: IRELLA.ssn, address },
  box1: 31400,
  box2: 1620,
};

const EXPLANATION = [
  "I am a full-time doctoral student in chemistry at Prairie Crest State University.",
  "I first entered the United States on August 15, 2020, on an F-1 visa to begin my studies, and I was a resident of the People's Republic of China immediately before.",
  "I meet the substantial presence test for 2025 and am a resident alien for tax purposes.",
  "Article 20(c) of the United States-People's Republic of China income tax treaty exempts up to $5,000 a year of a student's income from personal services in the United States.",
  "Paragraph 2 of the 1984 Protocol to the treaty excepts Article 20 from the saving clause, so the exemption continues to apply to a resident alien.",
  "I claim the exemption for $5,000 of the $31,400 of wages that the university paid me as a teaching assistant in 2025 (Form W-2, box 1).",
  "The $5,000 is entered as a negative amount on Schedule 1 (Form 1040), line 8z.",
].join(" ");

/* The made-up position: a resident alien student keeps a treaty exemption under a saving-clause exception. */
const treatyPosition: TreatyPositionFactValue = {
  owner: "taxpayer",
  reportingWaived: false,
  section6114Disclosure: true,
  dualResidentDisclosure: false,
  treatyCountry: "People's Republic of China",
  articles: "20(c); Protocol, paragraph 2",
  codeProvisions: "Sections 61 and 7701(b)",
  payor: "Prairie Crest State University, EIN 00-0008833\n1200 Campus Loop\nAustin, TX 78712",
  specificallyRequired: false,
  explanation: EXPLANATION,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: IRELLA_USER_ID, taxYear: IRELLA_TAX_YEAR, suffix, value });

export const irellaFacts: TaxFactRow[] = [
  idFact("name.first", IRELLA.firstName),
  idFact("name.last", IRELLA.lastName),
  idFact("ssn", IRELLA.ssn),
  idFact("dob", "03/21/1998"),
  idFact("address.street", IRELLA.street),
  idFact("address.apt", IRELLA.apt),
  idFact("address.city", IRELLA.city),
  idFact("address.state", IRELLA.state),
  idFact("address.zip", IRELLA.zip),
  idFact("occupation", "Graduate Student"),
  idFact("phone", "512-555-0188"),
  fact("wages", makeW2FactKey("prairie-crest"), w2, "W-2 from Prairie Crest State University."),
  fact(
    "other",
    OTHER_INCOME_KEYS.otherItems,
    [
      {
        description: "Exempt income, People's Republic of China, Article 20(c)",
        amount: -IRELLA_EXEMPT_WAGES,
      },
    ],
    `${VERBAL}: the treaty exemption, in parentheses on Schedule 1 line 8z (Pub. 519, chapter 9).`,
  ),
  fact(
    "foreign",
    makeTreatyPositionFactKey("china-article-20c"),
    treatyPosition,
    `${VERBAL}: she discloses the Article 20(c) position on Form 8833.`,
  ),
];
