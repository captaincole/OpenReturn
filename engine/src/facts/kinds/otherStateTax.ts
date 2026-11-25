/*
 * Schedule S (California): net income tax a full-year California resident paid
 * to another state on income California also taxes. One fact per state: "If you
 * have a credit from more than one state, figure the credit separately by
 * completing a separate Schedule S for each state"
 * (ca-540-sched-s-inst-2025::sec::specific-line-instructions::b01). The other
 * state's return is not in the engine, so the taxpayer states each amount from
 * it.
 */

type FactRow = { key: string; value: unknown; category: string };

/*
 * One Part I row: an income item taxed by both states, such as "wages earned in
 * another state while a California resident"
 * (ca-540-sched-s-inst-2025::sec::part-i-double-taxed-income::b01). For a
 * resident, the item must have its source in the other state under California's
 * rules (ca-540-sched-s-inst-2025::sec::h-income-from-sources-within-the-other-state::b01).
 */
export interface OtherStateTaxItem {
  /* Column (a). */
  description: string;
  /* Column (b): the amount of the item California taxes. */
  californiaAmount: number;
  /* Column (c): the amount of the item the other state taxes. */
  otherStateAmount: number;
}

export interface OtherStateTaxFactValue {
  /* The other state's or U.S. possession's two-letter abbreviation (line 7). */
  state: string;
  /* Part I: each double-taxed income item. */
  items: OtherStateTaxItem[];
  /*
   * Line 7: the other state's income tax liability net of all its credits. Not
   * a city or county tax, not a tax like California's AMT, not a tax that is not
   * on net income (ca-540-sched-s-inst-2025::sec::part-ii-figure-your-other-state-tax-credit::b02).
   */
  taxPaid: number;
  /*
   * Line 9: for a resident, only the items of adjusted gross income the other
   * state taxes (ca-540-sched-s-inst-2025::sec::part-ii-figure-your-other-state-tax-credit::b02).
   */
  otherStateAdjustedGrossIncome: number;
  /*
   * Resident under both California and Virginia law: Virginia allows the credit
   * only then (ca-540-sched-s-inst-2025::sec::c-california-residents::b02).
   * Absent: not a dual resident.
   */
  dualResident?: boolean;
  /*
   * The tax is the taxpayer's share of a group nonresident (composite) return,
   * which also allows Arizona, Oregon and Virginia
   * (ca-540-sched-s-inst-2025::sec::c-california-residents::b02). Absent: the
   * taxpayer's own return.
   */
  groupNonresidentReturn?: boolean;
}

export interface OtherStateTaxFact {
  key: string;
  value: OtherStateTaxFactValue;
}

const OTHER_STATE_TAX_CATEGORY = "state_local_tax";
const OTHER_STATE_TAX_PREFIX = "other_state_tax.";

export function makeOtherStateTaxFactKey(stateSlug: string): string {
  return `${OTHER_STATE_TAX_PREFIX}${stateSlug}`;
}

export function isOtherStateTaxFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === OTHER_STATE_TAX_PREFIX && parts[1] !== "";
}

/* Every other-state fact, in the order recorded: the order of the Schedules S. */
export function getOtherStateTaxFacts(facts: ReadonlyArray<FactRow>): OtherStateTaxFact[] {
  return facts
    .filter((row) => row.category === OTHER_STATE_TAX_CATEGORY && isOtherStateTaxFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as OtherStateTaxFactValue }));
}
