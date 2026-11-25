/*
 * FTB 3804-CR, the pass-through entity (PTE) elective tax credit: California
 * tax that an electing partnership, S corporation or LLC paid for its owner.
 * One fact per electing entity, one Part I row each
 * (ca-3804cr-inst-2025::sec::part-i-elective-tax-credit-amount::b01). The
 * credit "will be reflected on the qualified taxpayer's Schedule K-1 ... Other
 * credits line" with a statement (ca-3804cr-inst-2025::sec::b-definitions::b03),
 * so the taxpayer states it as the K-1 prints it. The California K-1 itself is
 * not in the engine.
 */

type FactRow = { key: string; value: unknown; category: string };

export interface CaPteElectiveCreditFactValue {
  /* Column (a): the electing entity's name. */
  entityName: string;
  /*
   * Column (b): the entity's California corporation number; without one, its
   * Secretary of State file number or FEIN
   * (ca-3804cr-inst-2025::sec::line-1-column-b-entity-identification-number::b01).
   */
  entityId: string;
  /*
   * Column (c): the credit for 2025, 9.3% of the owner's share of qualified net
   * income and guaranteed payments, as the K-1 (100S, 541, 565 or 568) reports it
   * (ca-3804cr-inst-2025::sec::line-1-column-c-pte-elective-tax-credit-s::b01).
   * On a separate return of a married person, the part this return claims
   * (ca-3804cr-inst-2025::sec::e-limitations::b01).
   */
  credit: number;
  /*
   * The credit came through a single member LLC that is disregarded for tax
   * purposes. Its use is then limited to the tax on that LLC's income
   * (ca-3804cr-inst-2025::sec::e-limitations::b01), which the engine does not
   * figure. Absent: the owner holds the interest directly.
   */
  throughDisregardedSmllc?: boolean;
}

export interface CaPteElectiveCreditFact {
  key: string;
  value: CaPteElectiveCreditFactValue;
}

/*
 * Line 2 of Part II: the unused credit carried from 2024, line 5 of the 2024
 * FTB 3804-CR (ca-3804cr-inst-2025::sec::line-2-credit-carryover-from-prior-year::b01).
 * A number; 0 when none.
 */
export const CA_PTE_CREDIT_CARRYOVER_KEY = "prior_year.ca_pte_elective_credit_carryover";

const PTE_CREDIT_CATEGORY = "state_local_tax";
const PTE_CREDIT_PREFIX = "ca_pte_elective_credit.";

export function makeCaPteElectiveCreditFactKey(entitySlug: string): string {
  return `${PTE_CREDIT_PREFIX}${entitySlug}`;
}

export function isCaPteElectiveCreditFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === PTE_CREDIT_PREFIX && parts[1] !== "";
}

/* Every electing-entity fact, in the order recorded: the order of the Part I rows. */
export function getCaPteElectiveCreditFacts(
  facts: ReadonlyArray<FactRow>,
): CaPteElectiveCreditFact[] {
  return facts
    .filter((row) => row.category === PTE_CREDIT_CATEGORY && isCaPteElectiveCreditFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as CaPteElectiveCreditFactValue }));
}
