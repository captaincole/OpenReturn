/*
 * Form 4255: the increase in tax when a general business credit claimed in an
 * earlier year is recaptured, and the excessive payments, excessive credit
 * transfers and penalties of the elective payment and transfer rules
 * (irs-4255-inst-2025::sec::general-instructions::b01). The earlier credit is
 * on the earlier year's Form 3468 and Form 3800, which the engine does not
 * read: the taxpayer states those amounts.
 *
 * Three kinds of fact, all in the category "other":
 * - one Part I line (credit_recapture.line.<line>): the earlier-year amounts
 *   of one credit and what happened this year that is not a property event;
 * - one property of Part II (credit_recapture.property.<slug>): the original
 *   credit and the recapture event;
 * - one hydrogen facility of Part III (credit_recapture.emissions_tier.<slug>).
 * Every date is YYYY-MM-DD. Every rate is a decimal (0.2 for 20%).
 */

type FactRow = { key: string; value: unknown; category: string };

/* The Part I lines, in form order (the blank form). */
export const FORM_4255_LINES = [
  "1a",
  "1b",
  "1c",
  "1d",
  "1e",
  "1f",
  "1g",
  "1h",
  "1i",
  "1j",
  "1k",
  "1l",
  "1m",
  "1n",
  "1o",
  "1z",
  "2a",
  "2b",
  "2z",
] as const;
export type Form4255Line = (typeof FORM_4255_LINES)[number];

/*
 * One Worksheet 3 column: a section 48 or 48E property that took the increased
 * credit for the prevailing wage and apprenticeship requirements and failed the
 * prevailing wage requirements for alteration or repair within 5 years
 * (irs-4255-inst-2025::sec::worksheet-2::b07; property-project-facility-or-technology::b01).
 */
export interface PrevailingWageRecaptureEntry {
  description: string;
  /* Worksheet 3 line 1: the credit originally figured, without the 1 MW or beginning-of-construction amounts. */
  credit: number;
  /* Worksheet 3 line 3. */
  placedInService: string;
  /* Worksheet 3 line 4. */
  failedOn: string;
}

/*
 * A recapture figured on another form or worksheet that the line's column (h)
 * takes: Form 8933 Schedule D for line 2a (irs-8933-inst-2025::sec::line-10::b01),
 * the Form 8911 recapture for line 2b, the low-income communities bonus credit
 * for line 1j (irs-4255-inst-2025::sec::lines-1-and-2::b01).
 */
export interface OtherRecapture {
  /* Where it was figured ("Form 8933, Schedule D"). */
  source: string;
  /* The increase in tax. */
  increaseInTax: number;
  /* The part of the credit carryforward it takes away (column (i)); absent: none. */
  carryoverReduction?: number;
  /* The recapture percentage it used, a decimal, for column (g); absent: none. */
  percentage?: number;
}

export interface CreditRecaptureLineFactValue {
  /* Line 1z or 2z: the form the credit came from ("Form 8864"). */
  otherForm?: string;
  /* Column (a): the credit or deduction claimed in earlier years, as adjusted. */
  creditClaimed: number;
  /* Column (e): the part of the credit that is not an elective payment and reduced regular tax. */
  nonElectiveCreditAppliedToTax: number;
  /* Column (b): the gross elective payment election amount in column (a); absent: none. */
  grossElectivePayment?: number;
  /* Column (c): the part of column (b) applied against regular tax (the section 38(c) limit). */
  grossElectivePaymentAppliedToTax?: number;
  otherRecapture?: OtherRecapture;
  /* Lines 1g and 1j: Worksheet 3, one entry per property. */
  prevailingWageRecaptures?: PrevailingWageRecaptureEntry[];
  /*
   * An excessive payment the IRS determined (irs-4255-inst-2025::sec::excessive-payment::b01):
   * the part related to the net elective payment amount (column (n)(1)) and the
   * rest (column (n)(2)). With no reasonable cause, 20% more (column (n)(3)).
   */
  excessivePayment?: { netPortion: number; otherPortion: number; reasonableCause: boolean };
  /*
   * An excessive credit transfer the IRS determined, for a transferee (column (m)(1);
   * excessive-credit-transfer::b01). With no reasonable cause, 20% more (column (m)(2)).
   */
  excessiveCreditTransfer?: { amount: number; reasonableCause: boolean };
  /* Column (m)(3): the section 6418(g)(3) recapture a transferee figured after the seller's notice. */
  creditTransferRecapture?: number;
  /* The prevailing wage penalty from Form 7220, Part IV, column (f), before it is split over columns (o). */
  prevailingWagePenalty?: number;
  /* The apprenticeship penalty from Form 7220, Part III, column (i), before it is split over columns (p). */
  apprenticeshipPenalty?: number;
}

/*
 * Line 12 is 0 for these events, whatever the dates (irs-4255-inst-2025::sec::line-12::b01):
 * a gasification or advanced coal project that fails the separation and
 * sequestration requirements, and an advanced manufacturing applicable
 * transaction within 10 years (line 15: "Enter 100").
 */
export type ZeroYearEvent = "sequestration_failure" | "advanced_manufacturing_expansion";

/* Part II Section C: section 49(a)(1) applies to the property (section-c-recapture-from-increase-in::b01). */
export interface NonrecourseFinancingChange {
  /* Line 3: the net change this year; an increase is positive, a decrease negative. */
  netChange: number;
  /* Line 8: Worksheet 1, the unused credits that would have been allowed. */
  unusedCreditsWithCurrentBase: number;
}

/* Part II Section D: the property was disposed of or stopped qualifying this year. */
export interface CreditPropertyDisposition {
  /* Line 10: the date placed in service (the form prints the first of its month). */
  placedInService: string;
  /* Line 11: the date the property was disposed of or stopped qualifying. */
  ceased: string;
  /* Line 13: Worksheet 2, the unused credits that would have been allowed without this property. */
  unusedCreditsWithoutProperty: number;
  /*
   * The credit from this property not used yet (carryforwards and carrybacks),
   * which the recapture percentage reduces (carryover-adjustment-on-recapture::b01).
   */
  unusedCredit: number;
  zeroYearEvent?: ZeroYearEvent;
}

export interface CreditRecapturePropertyFactValue {
  /* The Part I line whose column (h) takes this property's recapture. */
  line: Form4255Line;
  /* Section A: the type of property and credit. */
  description: string;
  /* Line 1: the rate of the original credit, a decimal. */
  originalRate: number;
  /* Line 2: the credit base at the end of last year (cost or other basis, as adjusted). */
  creditBase: number;
  /* Line 5 cap: a dollar limit on the credit (line-5::b01); absent: none. */
  creditLimit?: number;
  /* Line 6: credits taken for the property on Form 3800 in earlier years. */
  creditTaken: number;
  /* Line 17: the IRS registration number of an elective payment or transfer election. */
  registrationNumber?: string;
  nonrecourseFinancing?: NonrecourseFinancingChange;
  disposition?: CreditPropertyDisposition;
}

/* Part III: one specified clean hydrogen production facility (part-iii::b01). */
export interface EmissionsTierRecaptureFactValue {
  /* Line 1: the emissions rate or value from Form 3468, Part I, line 2a(i), as printed. */
  designedEmissionsRate: string;
  /* Line 2: the basis from Form 3468, Part VI, Section M. */
  basis: number;
  /* Line 3: the energy percentage used for the credit, a decimal. */
  energyPercentage: number;
  /* Lines 5 and 6 from this year's annual verification report; absent: no report, both 0. */
  verificationReport?: { emissionsRate: string; energyPercentage: number };
}

const CATEGORY = "other";
const LINE_PREFIX = "credit_recapture.line.";
const PROPERTY_PREFIX = "credit_recapture.property.";
const FACILITY_PREFIX = "credit_recapture.emissions_tier.";

export const makeCreditRecaptureLineFactKey = (line: Form4255Line): string =>
  `${LINE_PREFIX}${line}`;
export const makeCreditRecapturePropertyFactKey = (slug: string): string =>
  `${PROPERTY_PREFIX}${slug}`;
export const makeEmissionsTierRecaptureFactKey = (slug: string): string =>
  `${FACILITY_PREFIX}${slug}`;

const tailAfter = (prefix: string, key: string): string | undefined =>
  key.startsWith(prefix) && key.length > prefix.length && !key.slice(prefix.length).includes(".")
    ? key.slice(prefix.length)
    : undefined;

const isForm4255Line = (text: string | undefined): text is Form4255Line =>
  FORM_4255_LINES.some((line) => line === text);

export interface CreditRecaptureFacts {
  lines: Array<{ key: string; line: Form4255Line; value: CreditRecaptureLineFactValue }>;
  properties: Array<{ key: string; value: CreditRecapturePropertyFactValue }>;
  facilities: Array<{ key: string; value: EmissionsTierRecaptureFactValue }>;
  /* A credit_recapture.line.* key that names no Part I line. */
  unknownLineKeys: string[];
}

/* One row per key, the last one recorded, in the order the keys were first recorded. */
function lastPerKey(facts: ReadonlyArray<FactRow>): FactRow[] {
  const byKey = new Map<string, FactRow>();
  for (const row of facts) if (row.category === CATEGORY) byKey.set(row.key, row);
  return [...byKey.values()];
}

/* Every Form 4255 fact, in the order recorded (the order of the properties A to D). */
export function getCreditRecaptureFacts(facts: ReadonlyArray<FactRow>): CreditRecaptureFacts {
  const rows = lastPerKey(facts);
  const lineRows = rows.filter((row) => tailAfter(LINE_PREFIX, row.key) !== undefined);
  return {
    lines: lineRows
      .filter((row) => isForm4255Line(tailAfter(LINE_PREFIX, row.key)))
      .map((row) => ({
        key: row.key,
        line: tailAfter(LINE_PREFIX, row.key) as Form4255Line,
        value: row.value as CreditRecaptureLineFactValue,
      })),
    properties: rows
      .filter((row) => tailAfter(PROPERTY_PREFIX, row.key) !== undefined)
      .map((row) => ({ key: row.key, value: row.value as CreditRecapturePropertyFactValue })),
    facilities: rows
      .filter((row) => tailAfter(FACILITY_PREFIX, row.key) !== undefined)
      .map((row) => ({ key: row.key, value: row.value as EmissionsTierRecaptureFactValue })),
    unknownLineKeys: lineRows
      .filter((row) => !isForm4255Line(tailAfter(LINE_PREFIX, row.key)))
      .map((row) => row.key),
  };
}

export const hasCreditRecaptureFacts = (found: CreditRecaptureFacts): boolean =>
  found.lines.length + found.properties.length + found.facilities.length > 0;
