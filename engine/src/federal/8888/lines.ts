import { atLeast, roundDollars, sum } from "../../money.js";

/* "Each deposit must be at least $1" (irs-8888-form-2025::sec::lines-1a-2a-and-3a::b01). */
export const LEAST_DEPOSIT = 1;

/*
 * "Use Form 8888 if you want us to directly deposit your refund (or part of it)
 * to either two or three accounts"; one account goes on the return instead
 * (irs-8888-form-2025::sec::general-instructions::b01).
 */
export const LEAST_ACCOUNTS = 2;
export const MOST_ACCOUNTS = 3;

/*
 * The whole dollars each account gets, in the order of the accounts. A stated
 * amount is rounded to the whole dollar: the refund it splits is a whole-dollar
 * line (Form 1040 line 35a). The engine fills the gap between the stated amounts
 * and the refund by the order the IRS uses when a math error changes the refund
 * (irs-8888-form-2025::sec::math-errors::b01, b02):
 * - more refund than stated: "the additional amount will be deposited to the last
 *   account listed". An account with no stated amount takes it instead, since its
 *   taxpayer asked it to take what the others leave (QUESTIONS.md question 1).
 * - less refund than stated: "the decrease will be taken first from any deposit
 *   to an account on line 3, next from the deposit to the account on line 2, and
 *   finally from the deposit to the account on line 1."
 */
export function allocateRefund(
  refund: number,
  statedAmounts: ReadonlyArray<number | undefined>,
): number[] {
  const amounts = statedAmounts.map((amount) =>
    amount === undefined ? 0 : roundDollars(atLeast(0, amount)),
  );
  if (amounts.length === 0) return amounts;
  const restIndex = statedAmounts.indexOf(undefined);
  const extra = atLeast(0, refund) - sum(...amounts);
  if (extra >= 0) {
    amounts[restIndex === -1 ? amounts.length - 1 : restIndex] += extra;
    return amounts;
  }
  let shortfall = -extra;
  for (let index = amounts.length - 1; index >= 0 && shortfall > 0; index -= 1) {
    const taken = Math.min(amounts[index], shortfall);
    amounts[index] -= taken;
    shortfall -= taken;
  }
  return amounts;
}

/* One deposit line of the form: which account (its index), and the dollars. */
export interface Deposit {
  account: number;
  amount: number;
}

export interface Form8888Lines {
  /* Lines 1, 2 and 3 in order: only the accounts that get at least $1. */
  deposits: Deposit[];
  /* Line 5: "Add lines 1a, 2a, and 3a" (irs-8888-form-2025::sec::line-5::b01). */
  line5: number | undefined;
}

/*
 * Lines 1a–3a and 5. An account the split leaves with less than $1 gets no line
 * ("Each deposit must be at least $1"); the accounts that stay move up in order,
 * so line 1 always has the first of them (QUESTIONS.md question 2). Line 5
 * equals the refund, as line-5::b01 requires: the split adds up to it.
 */
export function form8888Lines(
  refund: number,
  statedAmounts: ReadonlyArray<number | undefined>,
): Form8888Lines {
  const deposits = allocateRefund(refund, statedAmounts)
    .map((amount, account) => ({ account, amount }))
    .filter((deposit) => deposit.amount >= LEAST_DEPOSIT)
    .slice(0, MOST_ACCOUNTS);
  const line5 = deposits.length === 0 ? undefined : sum(...deposits.map((each) => each.amount));
  return { deposits, line5 };
}
