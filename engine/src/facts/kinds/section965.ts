/*
 * Form 965-A: the section 965 transition tax of an individual, paid over
 * eight years or deferred by an S corporation shareholder. The form "is
 * intended to be a cumulative report of a taxpayer's net 965 tax liabilities
 * through payment in full" (irs-965a-inst-2025::sec::general-instructions::b01).
 * For 2025 every amount comes from last year's Form 965-A as the taxpayer
 * states it: the engine does not compute a foreign corporation's amounts or
 * the earlier year's tax "with" and "without" section 965.
 *
 * Four kinds of fact:
 * - SECTION_965_INCLUSION_PREFIX + year: one Part I line 1 to 4 (2017 to 2020),
 *   with its Part II payments.
 * - SECTION_965_OTHER_PREFIX + slug: one Part I line 5 to 8 (a liability
 *   assumed by transfer, or a deferred S corporation liability that a
 *   triggering event made payable), with its Part II payments.
 * - SECTION_965_S_CORPORATION_PREFIX + slug: one Part III row (one S
 *   corporation for one inclusion year).
 * - SECTION_965_DEFERRED_PREFIX + slug: one Part IV row (a deferred S
 *   corporation liability, or one transferred in).
 */

type FactRow = { key: string; value: unknown; category: string };

const SECTION_965_CATEGORY = "foreign";

export const SECTION_965_INCLUSION_PREFIX = "section_965.inclusion.";
export const SECTION_965_OTHER_PREFIX = "section_965.other_liability.";
export const SECTION_965_S_CORPORATION_PREFIX = "section_965.s_corporation.";
export const SECTION_965_DEFERRED_PREFIX = "section_965.deferred.";

/* The years with a printed Part I line: 2017 is line 1, 2020 is line 4 (irs-965a-inst-2025::sec::lines-1-through-8::b01). */
export type Section965InclusionYear = 2017 | 2018 | 2019 | 2020;
export const SECTION_965_INCLUSION_YEARS: readonly Section965InclusionYear[] = [
  2017, 2018, 2019, 2020,
];

/*
 * Part II columns (b) to (i): what was paid for installment year 1 to 8, as
 * last year's Form 965-A shows it. Only the years before 2025: the engine
 * figures the payment for the reporting year. A year with no payment is absent.
 */
export type Section965Payments = Partial<Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, number>>;

/* What every Part I line carries besides its liability. */
interface Section965LineCommon {
  /*
   * Part I column (j): every transfer out (negative), transfer in (positive)
   * and later adjustment (an audit: positive for an increase) of this line's
   * liability, added up through 2025 (irs-965a-inst-2025::sec::lines-1-through-8::b08, b09).
   * Absent: none.
   */
  transfersAndAdjustments?: number;
  /* Part I column (k): the TIN of the transferee or the transferor. */
  counterpartyTin?: string;
  paidByInstallmentYear?: Section965Payments;
  /*
   * The payment made for 2025 when it is not the scheduled installment, as
   * "If, for any reason, the actual payment differs from the schedule, report
   * the actual payment made" (irs-965a-inst-2025::sec::line-1::b01): an
   * acceleration event, or an overpayment of other tax applied to it. Absent:
   * the engine figures the installment due.
   */
  paidThisYear?: number;
}

/* One Part I line 1 to 4. */
export interface Section965InclusionValue extends Section965LineCommon {
  /* Column (b): the net income tax for the inclusion year with all section 965 amounts. */
  netTaxWithAll965: number;
  /* Column (c): the net income tax for that year without section 965. */
  netTaxWithout965: number;
  /* Column (g): the election to pay in 8 installments under section 965(h). */
  installmentElection: boolean;
}

/*
 * One Part I line 5 to 8 (irs-965a-inst-2025::sec::lines-1-through-8::b01 to b06):
 * - "transfer_in": the taxpayer assumed another taxpayer's installment
 *   liability. year = the year of the liability assumed; the amount assumed
 *   is transfersAndAdjustments (positive).
 * - "triggered": a deferred S corporation liability that a triggering event
 *   made payable. year = the year of the triggering event.
 */
export interface Section965OtherLiabilityValue extends Section965LineCommon {
  kind: "transfer_in" | "triggered";
  year: number;
  /* Column (f) of a triggered liability. */
  triggeredLiability?: number;
  /* Column (g) of a triggered liability. */
  installmentElection?: boolean;
}

/* One Part III row (irs-965a-inst-2025::sec::lines-1-through-4::b01 to b03). */
export interface Section965SCorporationValue {
  inclusionYear: Section965InclusionYear;
  /* Column (a), abbreviated as needed. */
  name: string;
  /* Column (b): the S corporation's EIN. */
  ein: string;
  /* Column (c): the net income tax with only the section 965 amounts from this S corporation. */
  netTaxWithThisSCorporation: number;
  /* Column (f): the election to defer under section 965(i). Column (d) is Part I column (c). */
  deferralElection: boolean;
}

/* One Part IV row (irs-965a-inst-2025::sec::part-iv-annual-report-of-deferred::b01 to b06). */
export interface Section965DeferredValue {
  /* Column (a): the year of the deferral election, or of the transfer in. */
  electionOrTransferYear: number;
  /* Column (b). */
  name: string;
  /* Column (c): the S corporation's EIN. */
  ein: string;
  /* Column (d): last year's column (i); absent for a liability transferred in during 2025. */
  beginningDeferred?: number;
  /* Column (f): the amount a 2025 triggering event made payable, as a positive number. Absent: none. */
  triggeredThisYear?: number;
  /* Column (g): a 2025 transfer out (negative) or in (positive) by agreement. Absent: none. */
  transferThisYear?: number;
  /* Column (h): the TIN of the transferee or the transferor. */
  transferCounterpartyTin?: string;
}

export interface Section965Fact<T> {
  key: string;
  value: T;
}

function factsWithPrefix<T>(facts: ReadonlyArray<FactRow>, prefix: string): Section965Fact<T>[] {
  return facts
    .filter(
      (row) =>
        row.category === SECTION_965_CATEGORY &&
        row.key.startsWith(prefix) &&
        row.key.length > prefix.length,
    )
    .map((row) => ({ key: row.key, value: row.value as T }));
}

export function makeSection965InclusionFactKey(year: Section965InclusionYear): string {
  return `${SECTION_965_INCLUSION_PREFIX}${year}`;
}

export function makeSection965OtherLiabilityFactKey(slug: string): string {
  return `${SECTION_965_OTHER_PREFIX}${slug}`;
}

export function makeSection965SCorporationFactKey(slug: string): string {
  return `${SECTION_965_S_CORPORATION_PREFIX}${slug}`;
}

export function makeSection965DeferredFactKey(slug: string): string {
  return `${SECTION_965_DEFERRED_PREFIX}${slug}`;
}

/* The Part I line 1 to 4 facts; a key whose year has no printed line is not one. */
export function getSection965InclusionFacts(
  facts: ReadonlyArray<FactRow>,
): Section965Fact<Section965InclusionValue>[] {
  const keys = SECTION_965_INCLUSION_YEARS.map(makeSection965InclusionFactKey);
  return factsWithPrefix<Section965InclusionValue>(facts, SECTION_965_INCLUSION_PREFIX).filter(
    (fact) => keys.includes(fact.key),
  );
}

/* The Part I line 5 to 8 facts, in the order recorded: the order of the lines. */
export function getSection965OtherLiabilityFacts(
  facts: ReadonlyArray<FactRow>,
): Section965Fact<Section965OtherLiabilityValue>[] {
  return factsWithPrefix(facts, SECTION_965_OTHER_PREFIX);
}

/* The Part III rows, in the order recorded. */
export function getSection965SCorporationFacts(
  facts: ReadonlyArray<FactRow>,
): Section965Fact<Section965SCorporationValue>[] {
  return factsWithPrefix(facts, SECTION_965_S_CORPORATION_PREFIX);
}

/* The Part IV rows, in the order recorded. */
export function getSection965DeferredFacts(
  facts: ReadonlyArray<FactRow>,
): Section965Fact<Section965DeferredValue>[] {
  return factsWithPrefix(facts, SECTION_965_DEFERRED_PREFIX);
}
