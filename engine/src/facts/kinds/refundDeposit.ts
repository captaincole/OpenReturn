/*
 * Form 8888: the accounts that get a direct deposit of the federal refund. One
 * fact per account, keyed by its line on the form: account 1 is line 1, account
 * 2 line 2, account 3 line 3. "Use Form 8888 if you want us to directly deposit
 * your refund (or part of it) to either two or three accounts"
 * (irs-8888-form-2025::sec::general-instructions::b01). The taxpayer states
 * each account; no document carries it.
 */

/* Lines 1c, 2c and 3c: one box per account (irs-8888-form-2025::sec::lines-1c-2c-and-3c::b01). */
export type RefundAccountType = "checking" | "savings";

export interface RefundDepositAccountFactValue {
  /* Lines 1b, 2b, 3b: nine digits (irs-8888-form-2025::sec::lines-1b-2b-and-3b::b01). */
  routingNumber: string;
  /*
   * Lines 1d, 2d, 3d: up to 17 letters and numbers, hyphens kept, spaces and
   * special symbols left out (irs-8888-form-2025::sec::lines-1d-2d-and-3d::b01).
   */
  accountNumber: string;
  accountType: RefundAccountType;
  /*
   * Lines 1a, 2a, 3a: the dollars the taxpayer wants in this account. Absent:
   * this account takes the part of the refund the other accounts leave. At
   * most one account leaves it out.
   */
  amount?: number;
}

export interface RefundDepositAccountFact {
  key: string;
  /* The account's line on Form 8888: 1, 2 or 3. */
  position: number;
  value: RefundDepositAccountFactValue;
}

/* Cade records each account fact in this category. */
export const REFUND_DEPOSIT_CATEGORY = "other";
const REFUND_DEPOSIT_PREFIX = "refund_deposit.account_";

/* The form has three account lines (irs-8888-form-2025::sec::general-instructions::b01). */
export const REFUND_DEPOSIT_POSITIONS = [1, 2, 3] as const;

export function makeRefundDepositFactKey(position: number): string {
  return `${REFUND_DEPOSIT_PREFIX}${position}`;
}

/*
 * Every refund account fact, in the order of its line on the form. Reads the
 * latest fact of each key (factByKey), so a corrected account replaces the old one.
 */
export function getRefundDepositFacts(
  factByKey: ReadonlyMap<string, unknown>,
): RefundDepositAccountFact[] {
  return REFUND_DEPOSIT_POSITIONS.flatMap((position) => {
    const key = makeRefundDepositFactKey(position);
    const value = factByKey.get(key);
    if (value === undefined || value === null) return [];
    return [{ key, position, value: value as RefundDepositAccountFactValue }];
  });
}
